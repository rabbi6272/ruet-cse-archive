import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemInstructions, AI_CONFIG } from '@/lib/ai-config';
import { performSearch, WEBSITE_KNOWLEDGE } from '@/lib/website-knowledge';
import { 
  getCurrentApiKey, 
  markApiKeyAsFailed, 
  rotateToNextApiKey,
  getApiKeyStats,
  resetFailedKeys 
} from '@/lib/api-key-manager';

// No need for static API key - will be managed dynamically

// Helper function to create Gemini client with current API key
async function createGeminiClient(retryCount = 0) {
  const maxRetries = 3;
  
  try {
    const apiKeyInfo = await getCurrentApiKey();
    const genAI = new GoogleGenerativeAI(apiKeyInfo.key);
    
    console.log(`🤖 Created Gemini client with API key ${apiKeyInfo.index + 1}/${apiKeyInfo.totalKeys} (Failed: ${apiKeyInfo.failedKeys})`);
    
    return {
      genAI,
      apiKey: apiKeyInfo.key,
      keyIndex: apiKeyInfo.index,
      stats: apiKeyInfo
    };
  } catch (error) {
    console.error(`❌ Failed to create Gemini client (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying with next API key...`);
      await rotateToNextApiKey();
      return createGeminiClient(retryCount + 1);
    }
    
    throw new Error(`Failed to create Gemini client after ${maxRetries + 1} attempts: ${error.message}`);
  }
}

// Helper function to handle API errors and retry with different keys
async function executeWithRetry(operation, currentApiKey, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ API Error (attempt ${retryCount + 1}):`, error.message);
    
    // Check if it's a quota/rate limit error
    const isQuotaError = error.message?.toLowerCase().includes('quota') ||
                        error.message?.toLowerCase().includes('rate limit') ||
                        error.message?.toLowerCase().includes('resource_exhausted') ||
                        error.message?.toLowerCase().includes('429') ||
                        error.status === 429;
    
    const isInvalidKeyError = error.message?.toLowerCase().includes('api_key') ||
                             error.message?.toLowerCase().includes('invalid') ||
                             error.message?.toLowerCase().includes('authentication') ||
                             error.status === 401 || error.status === 403;
    
    if ((isQuotaError || isInvalidKeyError) && retryCount < maxRetries) {
      console.log(`🔄 ${isQuotaError ? 'Quota exhausted' : 'Invalid/Auth error'} - marking key as failed and trying next...`);
      
      // Mark current key as failed
      await markApiKeyAsFailed(currentApiKey, error);
      
      // Get next API key and retry
      try {
        const newClient = await createGeminiClient();
        const newModel = newClient.genAI.getGenerativeModel({ 
          model: AI_CONFIG.api.model,
          systemInstruction: operation.systemInstruction // Pass system instruction if available
        });
        
        // Retry with new model
        return await executeWithRetry(
          () => operation.call ? operation.call(newModel) : operation(newModel), 
          newClient.apiKey, 
          retryCount + 1
        );
      } catch (retryError) {
        console.error(`❌ Retry failed:`, retryError);
        if (retryCount === maxRetries - 1) {
          throw new Error(`All API keys exhausted. Last error: ${retryError.message}`);
        }
        throw retryError;
      }
    }
    
    // For non-quota errors or max retries reached, throw original error
    throw error;
  }
}
// Helper function to detect if user is asking for search
function detectSearchIntent(message) {
  const searchKeywords = [
    'find', 'search', 'look for', 'show me', 'where can I find',
    'resources for', 'books about', 'code for', 'examples of',
    'materials for', 'help with', 'study', 'learn about'
  ];
  
  const lowerMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to detect course material requests and provide direct navigation
function detectCourseRequest(message) {
  const lowerMessage = message.toLowerCase();
  
  // Common course request patterns
  const coursePatterns = [
    /(?:ct|questions?|materials?|notes?|resources?|papers?)\s+(?:of|for)?\s*([a-z]+\s*\d{4})/i,
    /([a-z]+\s*\d{4})\s+(?:ct|questions?|materials?|notes?|resources?|papers?)/i,
    /(?:i\s+need|give\s+me|show\s+me|find)\s+.*?([a-z]+\s*\d{4})/i,
    /([a-z]+\s*\d{4})\s+(?:course|subject)/i
  ];
  
  for (const pattern of coursePatterns) {
    const match = message.match(pattern);
    if (match) {
      let courseCode = match[1].replace(/\s+/g, ' ').trim().toLowerCase();
      
      // Normalize common course codes
      const courseMap = {
        'chem 1113': 'Chemistry 1113',
        'chemistry 1113': 'Chemistry 1113',
        'eee 1151': 'EEE 1151',
        'electrical 1151': 'EEE 1151'
      };
      
      const normalizedCourse = courseMap[courseCode] || courseCode;
      
      return {
        detected: true,
        courseCode: normalizedCourse,
        originalRequest: message
      };
    }
  }
  
  return { detected: false };
}

// Enhanced response with search results
async function enhanceResponseWithSearch(userMessage, aiResponse) {
  try {
    const shouldSearch = detectSearchIntent(userMessage);
    
    if (shouldSearch) {
      const searchResults = await performSearch(userMessage);
      
      if (searchResults.length > 0) {
        let enhancedResponse = aiResponse + "\n\n**I found these relevant resources for you:**\n\n";
        
        searchResults.forEach((result, index) => {
          enhancedResponse += `${index + 1}. **${result.title}**\n`;
          enhancedResponse += `   ${result.description}\n`;
          if (result.path) {
            enhancedResponse += `   🔗 Go to: ${result.path}\n`;
          }
          enhancedResponse += "\n";
        });
        
        return enhancedResponse;
      }
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error enhancing response with search:', error);
    return aiResponse;
  }
}

export async function POST(request) {
  let clientInfo = null;
  
  try {
    const { message, chatHistory = [], userInfo = null } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create user context for Gemini
    let userContext = "";
    if (userInfo && userInfo.name) {
      const firstName = userInfo.name.split(' ')[0];
      userContext = `\n**CURRENT USER INFO:**\n- User Name: ${userInfo.name}\n- First Name: ${firstName}\n- Roll Number: ${userInfo.roll}\n- Status: Logged in to RUET CSE Archive\n- Call them by their first name (${firstName}) when appropriate!\n\n`;
    } else {
      userContext = "\n**CURRENT USER INFO:**\n- Status: Anonymous visitor (not logged in)\n- Use general greetings like 'mama' or 'vai'\n\n";
    }

    // Get API client with rotation
    clientInfo = await createGeminiClient();
    console.log(`📊 API Key Stats:`, getApiKeyStats());

    // Create the model with Flash 2.5 and system instructions
    const systemInstructions = getSystemInstructions() + userContext;
    const model = clientInfo.genAI.getGenerativeModel({ 
      model: AI_CONFIG.api.model,
      systemInstruction: systemInstructions
    });

    // Prepare chat history for Gemini (exclude initial bot welcome message)
    const filteredHistory = chatHistory.filter((msg, index) => {
      // Skip the first message if it's from bot (welcome message)
      if (index === 0 && msg.sender === 'bot') {
        return false;
      }
      return true;
    });

    const history = filteredHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Ensure we don't start with model role
    if (history.length > 0 && history[0].role === 'model') {
      history.shift(); // Remove first model message
    }

    // Check for course material requests
    const courseRequest = detectCourseRequest(message);
    if (courseRequest.detected) {
      // Add navigation link to the response
      const resourcesLink = `/resources?course=${encodeURIComponent(courseRequest.courseCode)}`;
      const driveLink = `/drive?search=${encodeURIComponent(courseRequest.courseCode)}`;
      
      let botMessage = `**🎯 Ami direct tumake course materials er kache niye jabo!**\n\n`;
      botMessage += `**${courseRequest.courseCode}** er jonno resources:\n`;
      botMessage += `🔗 **[Resources Page e jao](${resourcesLink})** - Structured course materials\n`;
      botMessage += `📁 **[Drive e search koro](${driveLink})** - All uploaded files\n\n`;
      botMessage += `Vai ekhane click korle direct course folder e chole jabe! Ar kono tension nai 😎⚡`;
      
      return Response.json({ 
        message: botMessage,
        success: true 
      });
    }

    // Execute chat with retry logic
    const chatOperation = async (modelToUse = model) => {
      const chat = modelToUse.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: AI_CONFIG.api.maxTokens,
          temperature: AI_CONFIG.api.temperature,
          topP: AI_CONFIG.api.topP,
          topK: AI_CONFIG.api.topK,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    };
    
    // Add system instructions to operation for retry purposes
    chatOperation.systemInstruction = systemInstructions;

    // Execute with automatic retry and API key rotation
    let botMessage = await executeWithRetry(chatOperation, clientInfo.apiKey);

    // Enhance with search results if applicable
    botMessage = await enhanceResponseWithSearch(message, botMessage);

    return Response.json({ 
      message: botMessage,
      success: true,
      meta: {
        apiKeyIndex: clientInfo.keyIndex + 1,
        totalKeys: clientInfo.stats.totalKeys,
        failedKeys: clientInfo.stats.failedKeys
      }
    });

  } catch (error) {
    console.error('🚨 AI Chat Error:', error);
    
    // Log detailed API key statistics on error
    try {
      const stats = getApiKeyStats();
      console.error('📊 API Key Stats on Error:', stats);
    } catch (statsError) {
      console.error('❌ Could not get API key stats:', statsError);
    }
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
      console.error('🔑 API Key Error - attempting emergency reset...');
      try {
        await resetFailedKeys();
        console.log('🔄 Emergency reset completed');
      } catch (resetError) {
        console.error('❌ Emergency reset failed:', resetError);
      }
      
      return Response.json({ 
        error: 'API configuration error. Please try again in a moment.' 
      }, { status: 500 });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return Response.json({ 
        error: 'Service temporarily unavailable due to high demand. Please try again in a few minutes.' 
      }, { status: 429 });
    }
    
    if (error.message?.includes('All API keys exhausted')) {
      return Response.json({ 
        error: 'All API services are currently unavailable. Please try again later.' 
      }, { status: 503 });
    }
    
    return Response.json({ 
      error: 'Sorry, I encountered an error. Please try again.' 
    }, { status: 500 });
  }
}
