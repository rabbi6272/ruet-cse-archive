import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemInstructions, AI_CONFIG } from '@/lib/ai-config';
import { performSearch, WEBSITE_KNOWLEDGE } from '@/lib/website-knowledge';

// Initialize Gemini Flash 2.5
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
    const { message, chatHistory = [] } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create the model with Flash 2.5
    const model = genAI.getGenerativeModel({ 
      model: AI_CONFIG.api.model,
      systemInstruction: getSystemInstructions()
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

    // Clean up any HTML tags that might have been generated
    botMessage = botMessage
      // Remove HTML tags while preserving content and ALL formatting
      .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, content) => {
        const hashes = '#'.repeat(parseInt(level));
        return `\n${hashes} ${content}\n`;
      })
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
        // Preserve ALL formatting in pre blocks - don't change anything
        return `\n\`\`\`\n${content}\n\`\`\`\n`;
      })
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      // Only clean up excessive empty lines, but preserve intentional spacing
      .replace(/(\n\s*){5,}/g, '\n\n\n\n') // Allow up to 4 consecutive newlines
      .trim();

    // Enhance response with search results if applicable
    botMessage = await enhanceResponseWithSearch(message, botMessage);

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
