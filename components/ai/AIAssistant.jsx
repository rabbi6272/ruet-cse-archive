'use client';

import { useState, useRef, useEffect } from 'react';
import AI_CONFIG from '@/lib/ai-config';
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";

// Enhanced format bot messages with comprehensive Markdown support
const formatBotMessage = (text) => {
  // Generate unique IDs for code blocks
  let codeBlockCounter = 0;
  
  // First, clean up any existing HTML that might be in the response
  let cleanedText = text
    // Remove HTML tags that might have been included in the response
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Handle pre/code blocks specially - preserve ALL content exactly
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]*>/g, '') // Remove any other HTML tags
    // Only clean up excessive whitespace outside of code blocks
    .replace(/(\n\s*){4,}/g, '\n\n\n') // Allow max 3 consecutive newlines
    .trim();
  
  return cleanedText
    // Headers (### Header, ## Header, # Header)
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-gray-800 mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')
    
    // Code blocks with triple backticks ```code``` - with copy button (PROCESS FIRST)
    .replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, language, code) => {
      const codeId = `code-block-${Date.now()}-${++codeBlockCounter}`;
      // Preserve ALL formatting - don't modify the code content at all
      const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const detectedLanguage = language || 'text';
      return `<div class="code-container dark:bg-gray-900 bg-gray-200 mt-4 rounded-lg overflow-hidden relative group max-w-full"><button data-copy-target="${codeId}" class="copy-code-btn px-2 py-1 rounded text-xs absolute top-2 right-2 opacity-100 xl:opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-white bg-gray-900 hover:bg-gray-800 text-white z-10" title="Copy code"><i class="far fa-copy mr-1"></i> Copy</button><pre id="${codeId}" class="p-4 overflow-auto font-cascadia whitespace-pre max-h-96 max-w-full" style="tab-size: 4;"><code class="language-${detectedLanguage} block">${escapedCode}</code></pre></div>`;
    })
    
    // Inline code `code` - with copy button for longer code (PROCESS SECOND)
    .replace(/`([^`]+)`/g, (match, code) => {
      const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (code.length > 20) {
        const codeId = `inline-code-${Date.now()}-${++codeBlockCounter}`;
        return `<span class="inline-flex items-center gap-1 dark:bg-gray-800 bg-gray-800 dark:text-gray-300 text-gray-200 px-2 py-1 rounded font-cascadia text-sm not-italic"><code id="${codeId}">${escapedCode}</code><button data-copy-target="${codeId}" class="copy-code-btn ml-1 p-0.5 dark:hover:bg-gray-700 hover:bg-gray-700 rounded transition-colors" title="Copy"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></span>`;
      }
      return `<code class="dark:bg-gray-800 bg-gray-800 dark:text-gray-300 text-gray-200 px-2 py-1 rounded font-cascadia text-sm not-italic">${escapedCode}</code>`;
    })
    
    // Bold text **text** (PROCESS AFTER CODE)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    
    // Italic text *text* - avoid affecting code elements (PROCESS LAST for text formatting)
    .replace(/\*([^*<>]+)\*/g, '<em class="italic text-gray-700">$1</em>')
    
    // Links with markdown [text](url) and direct links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-yellow-600 hover:text-yellow-800 underline font-medium" target="_blank">$1</a>')
    .replace(/🔗 Go to: (\/[\w\/\-]*)/g, '<a href="$1" class="text-yellow-600 hover:text-yellow-800 underline font-medium" target="_blank">🔗 Go to: $1</a>')
    
    // Blockquotes > text
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50 italic text-gray-700 my-2">$1</blockquote>')
    
    // Bullet points with dashes, asterisks, and plus
    .replace(/^[-*+] (.*$)/gm, '<div class="flex items-start my-1"><span class="text-yellow-500 mr-2 mt-1">•</span><span class="flex-1">$1</span></div>')
    
    // Numbered lists
    .replace(/^(\d+)\. (.*$)/gm, '<div class="flex items-start my-1"><span class="text-yellow-600 font-semibold mr-2 min-w-[1.5rem]">$1.</span><span class="flex-1">$2</span></div>')
    
    // Emojis at start of lines with enhanced styling
    .replace(/^(📚|💻|🔍|❓|🏠|📝|💡|🎓|⚡|🤖|📖|📊|🌐|🎯|🚀|⭐|🔥|💫) (.*$)/gm, '<div class="flex items-start my-2 p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg"><span class="text-xl mr-3">$1</span><span class="flex-1">$2</span></div>')
    
    // Special Pikachu/Electric themed elements
    .replace(/⚡/g, '<span class="text-yellow-500 animate-pulse">⚡</span>')
    .replace(/Pika pika!/g, '<span class="text-yellow-600 font-bold animate-bounce">Pika pika!</span>')
    .replace(/Nutrinos/g, '<span class="text-green-600 font-semibold bg-green-100 px-1 rounded">Nutrinos</span>')
    
    // Horizontal rules ---
    .replace(/^---$/gm, '<hr class="border-t-2 border-yellow-200 my-4">')
    
    // Tables (basic support)
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim());
      return `<div class="grid grid-cols-${cells.length} gap-2 border border-gray-200 rounded p-2 my-2">${cells.map(cell => `<div class="p-1 text-sm">${cell}</div>`).join('')}</div>`;
    })
    
    // Line breaks (convert \n to <br> but preserve structure)
    .replace(/\n\n/g, '<div class="my-3"></div>')
    .replace(/\n/g, '<br>');
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check for logged-in user
  useEffect(() => {
    const checkUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          // Check if user session is still valid
          if (user.expiry && new Date().getTime() < user.expiry) {
            setCurrentUser(user);
          } else {
            // Session expired, remove from localStorage
            localStorage.removeItem('user');
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking user login:', error);
        setCurrentUser(null);
      }
    };

    checkUser();
    
    // Check periodically for user login changes
    const interval = setInterval(checkUser, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const savedMessages = localStorage.getItem('pikachu_chat_history');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        } else {
          // If no history, start with welcome message
          const welcomeMessage = {
            id: 1,
            text: getPersonalizedWelcomeMessage(),
            sender: 'bot',
            timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          };
          setMessages([welcomeMessage]);
          localStorage.setItem('pikachu_chat_history', JSON.stringify([welcomeMessage]));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to welcome message if localStorage fails
        const welcomeMessage = {
          id: 1,
          text: getPersonalizedWelcomeMessage(),
          sender: 'bot',
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        };
        setMessages([welcomeMessage]);
      }
    };

    loadChatHistory();
  }, [currentUser]); // Re-run when user login status changes

  // Function to get personalized welcome message
  const getPersonalizedWelcomeMessage = () => {
    if (currentUser && currentUser.name) {
      const firstName = currentUser.name.split(' ')[0];
      return `Yoooo ${firstName} mama! ⚡ Ami Pikachu, tumader chaotic digital classmate! Dekho ${firstName}, RUET CSE Archive er shob kichu jani, Nutrinos system theke shuru kore Section C er shob ghotona! Aj ki korbo? Sikhan vai naki kibabe sombob? 😎`;
    }
    return AI_CONFIG.behavior.welcomeMessage;
  };

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Limit chat history to last 50 messages to prevent localStorage overflow
        const limitedMessages = messages.length > 50 ? messages.slice(-50) : messages;
        localStorage.setItem('pikachu_chat_history', JSON.stringify(limitedMessages));
        
        // Update state if we trimmed messages
        if (messages.length > 50 && limitedMessages.length !== messages.length) {
          setMessages(limitedMessages);
        }
      } catch (error) {
        console.error('Error saving chat history:', error);
        // If localStorage is full, try to clear some space
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old chat history');
          const recentMessages = messages.slice(-20); // Keep only last 20 messages
          setMessages(recentMessages);
          localStorage.setItem('pikachu_chat_history', JSON.stringify(recentMessages));
        }
      }
    }
  }, [messages]);

  // Copy to clipboard function
  const copyToClipboard = async (elementId, buttonElement) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const text = element.textContent || element.innerText;
      await navigator.clipboard.writeText(text);
      
      // Visual feedback
      const originalText = buttonElement.innerHTML;
      buttonElement.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Copied!
      `;
      buttonElement.classList.add('bg-green-500');
      buttonElement.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
      
      setTimeout(() => {
        buttonElement.innerHTML = originalText;
        buttonElement.classList.remove('bg-green-500');
        buttonElement.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Event delegation for copy buttons
  useEffect(() => {
    const handleCopyClick = (e) => {
      if (e.target.closest('.copy-code-btn')) {
        const button = e.target.closest('.copy-code-btn');
        const targetId = button.getAttribute('data-copy-target');
        if (targetId) {
          copyToClipboard(targetId, button);
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => {
      document.removeEventListener('click', handleCopyClick);
    };
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Apply syntax highlighting when messages change (matching codelibrary implementation)
  const needsHighlightRef = useRef(false);
  
  useEffect(() => {
    needsHighlightRef.current = true; // Flag to indicate highlighting is needed
    const highlight = () => {
      if (needsHighlightRef.current) {
        // Target only code blocks within AI messages
        document.querySelectorAll(".ai-message pre code").forEach((block) => {
          if (block.hasAttribute("data-highlighted")) {
            block.removeAttribute("data-highlighted");
          }
          hljs.highlightElement(block);
        });
        needsHighlightRef.current = false;
      }
    };

    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(highlight);
      });
    }, 150); // Slightly longer delay for DOM stability

    return () => clearTimeout(timeout);
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Function to clear chat history
  const clearChatHistory = () => {
    if (window.confirm('Ami ki chat history clear kore dibo? Eta undo kora jabe na! 🤔')) {
      try {
        localStorage.removeItem('pikachu_chat_history');
        const welcomeMessage = {
          id: Date.now(),
          text: getPersonalizedWelcomeMessage(),
          sender: 'bot',
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        };
        setMessages([welcomeMessage]);
        localStorage.setItem('pikachu_chat_history', JSON.stringify([welcomeMessage]));
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const sendMessage = async (customMessage = null) => {
    const message = customMessage || inputMessage.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customMessage) setInputMessage(''); // Only clear input if it's a manual message
    setIsLoading(true);

    try {
      // Prepare chat history for API (limit to recent messages)
      const recentMessages = messages.slice(-AI_CONFIG.behavior.maxMessages);
      const chatHistory = recentMessages.map(msg => ({
        text: msg.text,
        sender: msg.sender
      }));

      const response = await fetch(AI_CONFIG.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory,
          userInfo: currentUser ? {
            name: currentUser.name,
            roll: currentUser.roll
          } : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Simulate typing delay before showing bot response
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: data.message,
            sender: 'bot',
            timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, AI_CONFIG.behavior.typingDelay);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: AI_CONFIG.behavior.errorMessage,
        sender: 'bot',
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // File upload handling
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (100KB limit)
    const maxSize = 100 * 1024; // 100KB in bytes
    if (file.size > maxSize) {
      alert('⚡ Bzzt! File size should be less than 100KB. Please choose a smaller file!');
      return;
    }

    // Check file type
    const allowedExtensions = ['.txt', '.c', '.cpp', '.py', '.js', '.html', '.css', '.java'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert('⚡ Pika pika! I can only analyze these file types: ' + allowedExtensions.join(', '));
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: fileExtension,
        content: fileContent
      };
      
      setUploadedFile(fileInfo);
      
      // Auto-send analysis request
      const analysisMessage = `⚡ Pika! Please analyze this ${fileExtension} file (${file.name}) and provide:
1. 🐛 Bug Analysis: Identify any potential bugs or issues
2. 💡 Solution: Suggest fixes and improvements  
3. ⭐ Tips: Provide best practices and optimization tips

File Content:
\`\`\`${fileExtension.substring(1)}
${fileContent}
\`\`\``;

      sendMessage(analysisMessage);
    };

    reader.onerror = () => {
      alert('⚡ Bzzt! Error reading file. Please try again!');
    };

    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleClickOutside = (e) => {
    if (e.target.closest('#chatPopup') === null && 
        e.target.closest('#chatToggleBtn') === null) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="chatToggleBtn"
        onClick={toggleChat}
        className="fixed bottom-5 right-5 w-16 h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 hover:scale-110 hover:shadow-xl"
        title="Open Pikachu Assistant"
      >
        {isOpen ? AI_CONFIG.appearance.closeIcon : (
          <img 
            src={AI_CONFIG.appearance.avatar} 
            alt="Pikachu Assistant" 
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        )}
        <span className="hidden text-2xl">⚡</span>
      </button>

      {/* Chat Popup */}
      <div
        id="chatPopup"
        className={`fixed bottom-28 right-5 w-80 sm:w-96 max-w-[calc(100vw-2.5rem)] bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 z-50 transition-all duration-300 transform-gpu ${
          isOpen 
            ? 'scale-100 opacity-100' 
            : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="flex items-center px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div className="w-7 h-7 mr-2 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            <img 
              src={AI_CONFIG.appearance.avatar} 
              alt="Pikachu" 
              className="w-7 h-7 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="hidden text-lg">⚡</span>
          </div>
          <span className="font-semibold flex-1">
            {AI_CONFIG.appearance.name}
            {currentUser && (
              <span className="block text-xs font-normal opacity-90">
                Hey {currentUser.name.split(' ')[0]}! 👋
              </span>
            )}
          </span>
          
          {/* Clear Chat Button */}
          <button 
            onClick={clearChatHistory}
            className="mr-2 text-white/80 hover:text-white focus:outline-none p-1 rounded hover:bg-white/10 transition-colors"
            title="Clear chat history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Close Chat Button */}
          <button 
            onClick={toggleChat}
            className="text-white/80 hover:text-white focus:outline-none"
            title="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Chat Body */}
        <div 
          ref={chatBodyRef}
          className="p-3 h-80 overflow-y-auto space-y-2 text-sm bg-gray-50 ai-chat-container"
        >
          {messages.map((message) => (
            <div key={message.id}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl word-wrap break-words ${
                  message.sender === 'user'
                    ? 'bg-yellow-500 text-white ml-auto'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                {message.sender === 'bot' ? (
                  <div 
                    className="ai-message prose prose-sm max-w-none prose-yellow prose-headings:text-gray-900 prose-code:text-yellow-800 prose-code:bg-yellow-100"
                    dangerouslySetInnerHTML={{
                      __html: formatBotMessage(message.text)
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {message.text}
                  </div>
                )}
              </div>
              <div 
                className={`text-xs text-gray-500 mt-1 ${
                  message.sender === 'user' ? 'text-right' : ''
                }`}
              >
                {message.timestamp}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div>
              <div className="bg-white text-gray-800 border border-gray-200 max-w-[80%] p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Upload Info */}
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-yellow-50 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Upload code files (.txt, .c, .cpp, .py, .js, .html, .css, .java) for bug analysis & tips! Max 100KB ⚡</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center border-t border-gray-200 p-2 bg-white">
          <div className="flex items-center w-full">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={AI_CONFIG.behavior.placeholder}
              disabled={isLoading}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50"
            />
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.c,.cpp,.py,.js,.html,.css,.java"
              onChange={handleFileUpload}
              className="hidden"
            />
            {/* File upload button */}
            <button
              onClick={triggerFileUpload}
              disabled={isLoading}
              className="ml-2 p-2 w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Upload code file (max 100KB)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="ml-2 p-2 w-9 h-9 flex items-center justify-center rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-2 bg-white border-t border-gray-100">
          Powered by <strong>Gemini Flash 2.5</strong>
        </div>
      </div>

      {/* Mobile Responsive Styles and Font Definitions */}
      <style jsx global>{`
        /* Import Cascadia Code font */
        @import url('https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@200;300;400;500;600;700&display=swap');
        
        /* Define font class */
        .font-cascadia {
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-feature-settings: 'liga' 1, 'calt' 1 !important;
          font-variant-ligatures: normal !important;
        }
        
        /* Force Cascadia Code font on all code elements in AI messages */
        .ai-message code,
        .ai-message pre,
        .ai-message pre *,
        .font-cascadia,
        .font-cascadia * {
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-feature-settings: 'liga' 1, 'calt' 1 !important;
          font-variant-ligatures: normal !important;
        }
        
        /* Ensure proper highlighting for AI message code blocks */
        .ai-message pre {
          background: #272822 !important;
          color: #f8f8f2 !important;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        
        .ai-message pre code {
          background: transparent !important;
          color: inherit !important;
          padding: 0 !important;
          font-size: 0.875rem;
          line-height: 1.4;
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-feature-settings: 'liga' 1, 'calt' 1 !important;
          font-variant-ligatures: normal !important;
        }
        
        /* Fix inline code styling - preserve background */
        .ai-message code:not(pre code) {
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          background: #1f2937 !important;
          color: #e5e7eb !important;
        }
        
        /* Override the global code background reset for inline code */
        .ai-message span code {
          background: #1f2937 !important;
        }
        
        /* Enhanced code block styling with proper scrollbars */
        .ai-message pre {
          max-height: 400px;
          max-width: 100%;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
          white-space: pre !important;
          word-wrap: normal !important;
          word-break: normal !important;
        }
        
        .ai-message pre::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .ai-message pre::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        
        .ai-message pre::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        
        .ai-message pre::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        .ai-message pre::-webkit-scrollbar-corner {
          background: #1f2937;
        }
        
        /* Preserve indentation and formatting EXACTLY as written */
        .ai-message pre code {
          white-space: pre !important;
          word-wrap: normal !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          text-indent: 0 !important;
          tab-size: 4 !important;
          -moz-tab-size: 4 !important;
          line-height: 1.4 !important;
          font-variant-ligatures: normal !important;
        }
        
        /* Ensure pre element preserves ALL whitespace */
        .ai-message pre {
          white-space: pre !important;
          word-wrap: normal !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
        }
        
        /* Code container improvements */
        .code-container {
          position: relative;
          max-width: 100%;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          #chatPopup {
            width: calc(100% - 20px) !important;
            right: 10px !important;
            bottom: 5rem !important;
            max-width: none !important;
          }
          #chatPopup > div:nth-child(2) {
            height: 60vh !important;
          }
        }
      `}</style>
    </>
  );
}
