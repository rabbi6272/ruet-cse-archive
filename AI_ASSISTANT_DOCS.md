# AI Assistant Documentation

## Overview

The AI Assistant is a Gemini Flash 2.5 powered chatbot that appears as a floating icon on every page of the RUET CSE Archive platform. It provides intelligent assistance to users about platform features, academic content, and general CSE-related queries.

## Features

- 🤖 **Floating UI**: Round icon that stays at the bottom-right corner of every page
- 💬 **Smart Chat**: Powered by Google's Gemini Flash 2.5 model
- 🎓 **Context Aware**: Understands the platform and can guide users to relevant sections
- 📱 **Responsive**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast**: Optimized for quick responses and smooth animations
- 🔧 **Configurable**: Easy to customize appearance, behavior, and personality

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

To get your Gemini API key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key or use an existing one
3. Add it to your `.env.local` file

### 2. Installation

The required dependencies are already installed:

- `@google/generative-ai` - For Gemini integration
- `react` & `next.js` - Already part of your project

### 3. Integration

The AI Assistant is automatically integrated into your layout and will appear on all pages.

## Customization

### Appearance

Edit `lib/ai-config.js` to customize:

```javascript
appearance: {
  name: "Your Assistant Name",
  icon: "🤖", // Change the icon
  buttonIcon: "💬", // Change button icon
  colors: {
    primary: "blue-600", // Main color
    primaryHover: "blue-700", // Hover color
    // ... more colors
  }
}
```

### Behavior & Personality

Modify the assistant's responses and personality:

```javascript
behavior: {
  welcomeMessage: "Your custom welcome message",
  errorMessage: "Your custom error message",
  placeholder: "Your custom input placeholder",
  // ... more options
}
```

### Memory & Context

Update the platform knowledge and context:

```javascript
memory: {
  platformInfo: {
    // Update platform details
  },
  features: [
    // Add or modify feature descriptions
  ],
  personality: {
    // Adjust tone and expertise areas
  }
}
```

### API Settings

Fine-tune the Gemini model parameters:

```javascript
api: {
  model: "gemini-2.0-flash-exp",
  maxTokens: 1000,
  temperature: 0.7, // Creativity level (0-1)
  topP: 0.8,
  topK: 40
}
```

## File Structure

```
├── app/
│   └── api/
│       └── ai-chat/
│           └── route.js          # API endpoint for chat
├── components/
│   └── ai/
│       └── AIAssistant.jsx       # Main chat component
├── lib/
│   └── ai-config.js              # Configuration file
└── .env.local                    # Environment variables
```

## API Endpoint

**Endpoint**: `POST /api/ai-chat`

**Request Body**:

```json
{
  "message": "User's message",
  "chatHistory": [
    {
      "text": "Previous message",
      "sender": "user|bot"
    }
  ]
}
```

**Response**:

```json
{
  "message": "AI response",
  "success": true
}
```

## Usage Examples

### Basic Questions

- "How do I access the code library?"
- "Where can I find study resources?"
- "How do I connect with alumni?"

### Academic Help

- "Can you help me with C++ programming?"
- "What resources are available for data structures?"
- "How do I submit a doubt?"

### Platform Navigation

- "Where is my dashboard?"
- "How do I upload files to drive?"
- "What features are available for students?"

## Troubleshooting

### Common Issues

1. **API Key Error**

   - Ensure `GEMINI_API_KEY` is set in `.env.local`
   - Verify the API key is valid
   - Check if you have sufficient API quota

2. **Chat Not Appearing**

   - Verify the component is imported in `layout.jsx`
   - Check for JavaScript errors in console
   - Ensure Tailwind CSS is properly configured

3. **Slow Responses**
   - Check your internet connection
   - Verify Gemini API service status
   - Consider adjusting `maxTokens` in config

### Development Tips

1. **Testing**: Use the browser's developer tools to inspect network requests
2. **Debugging**: Add console.log statements in the API route
3. **Styling**: Use Tailwind's responsive classes for better mobile experience

## Security Considerations

- Never expose API keys in client-side code
- Implement rate limiting for production use
- Consider adding user authentication for personalized experiences
- Validate and sanitize user inputs

## Performance Optimization

- The chat history is limited to prevent excessive API calls
- Messages are truncated if too long
- Component uses React hooks for efficient state management
- CSS animations are GPU-accelerated

## Future Enhancements

Potential improvements you could add:

- Voice input/output
- File upload support
- Integration with platform search
- Personalized responses based on user profile
- Multi-language support
- Chat history persistence

## Support

For issues related to:

- **Gemini API**: Check [Google AI Studio documentation](https://ai.google.dev/)
- **React/Next.js**: Refer to [Next.js documentation](https://nextjs.org/docs)
- **Styling**: Check [Tailwind CSS documentation](https://tailwindcss.com/docs)

## License

This AI Assistant implementation follows the same license as your main project.
