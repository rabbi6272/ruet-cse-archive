import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemInstructions, AI_CONFIG } from '@/lib/ai-config';
import { performSearch, WEBSITE_KNOWLEDGE } from '@/lib/website-knowledge';

// Initialize Gemini Flash 1.5 (more stable quota)
const genAI = new GoogleGenerativeAI("AIzaSyBpMnoRGcBMG_oSxz0y9NOvYfBs1LNOMU8");

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

// Helper function to detect code generation requests and deny them
function detectCodeGenerationRequest(message) {
  const codeGenKeywords = [
    'generate code', 'write code', 'create code', 'make code', 'build code',
    'code for', 'write a program', 'create a program', 'make a program',
    'generate a function', 'write a function', 'create a function',
    'write solution', 'give me code', 'provide code', 'show code',
    'implement', 'coding solution', 'program to', 'algorithm code',
    'write script', 'create script', 'generate script'
  ];
  
  const lowerMessage = message.toLowerCase();
  const isCodeGenRequest = codeGenKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isCodeGenRequest) {
    return {
      detected: true,
      denialMessage: "Arey vai! 🚫 Ami code generate kori na... I don't encourage you to use such prompt-based generation. Rather I am here to debug your code, give suggestions, help debug your code to boost your capability! 💪\n\nTumi code likho, ami help korbo:\n✅ Debug korte parbo\n✅ Tips dite parbo\n✅ Best practices suggest korte parbo\n✅ Logic explain korte parbo\n\nCode Library (/codelibrary) te giye examples dekho, tarpor nijei try koro! Eita tumake better programmer banabe 🚀⚡"
    };
  }
  
  return { detected: false };
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

    // Create the model with Flash 2.5
    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.api.model,
      systemInstruction: getSystemInstructions() + userContext
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

    // Start chat with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: AI_CONFIG.api.maxTokens,
        temperature: AI_CONFIG.api.temperature,
        topP: AI_CONFIG.api.topP,
        topK: AI_CONFIG.api.topK,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    let botMessage = response.text();

    // Check for code generation requests first (highest priority)
    const codeGenRequest = detectCodeGenerationRequest(message);
    if (codeGenRequest.detected) {
      return Response.json({ 
        message: codeGenRequest.denialMessage,
        success: true 
      });
    }

    // Check for course material requests second
    const courseRequest = detectCourseRequest(message);
    if (courseRequest.detected) {
      // Add navigation link to the response
      const resourcesLink = `/resources?course=${encodeURIComponent(courseRequest.courseCode)}`;
      const driveLink = `/drive?search=${encodeURIComponent(courseRequest.courseCode)}`;
      
      botMessage += `\n\n**🎯 Ami direct tumake course materials er kache niye jabo!**\n\n`;
      botMessage += `**${courseRequest.courseCode}** er jonno resources:\n`;
      botMessage += `🔗 **[Resources Page e jao](${resourcesLink})** - Structured course materials\n`;
      botMessage += `📁 **[Drive e search koro](${driveLink})** - All uploaded files\n\n`;
      botMessage += `Vai ekhane click korle direct course folder e chole jabe! Ar kono tension nai 😎⚡`;
    } else {
      // Don't mess with Gemini's response - let it output clean markdown
      // Just enhance with search results if applicable
      botMessage = await enhanceResponseWithSearch(message, botMessage);
    }

    return Response.json({ 
      message: botMessage,
      success: true 
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY')) {
      return Response.json({ 
        error: 'API configuration error. Please contact support.' 
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'Sorry, I encountered an error. Please try again.' 
    }, { status: 500 });
  }
}
