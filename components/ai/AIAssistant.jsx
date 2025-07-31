'use client';
//new commit
import { useState, useRef, useEffect } from 'react';
import AI_CONFIG from '@/lib/ai-config';
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";


const formatBotMessage = (text) => {
 
  let codeBlockCounter = 0;
  
  // First, protect code blocks from HTML cleaning by temporarily replacing them
  const codeBlockPlaceholders = [];
  let tempText = text
    // Extract and protect code blocks first
    .replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlockPlaceholders.length}__`;
      codeBlockPlaceholders.push(match);
      return placeholder;
    })
    // Extract and protect inline code
    .replace(/`[^`]+`/g, (match) => {
      const placeholder = `__INLINE_CODE_${codeBlockPlaceholders.length}__`;
      codeBlockPlaceholders.push(match);
      return placeholder;
    });
  
  // Now clean HTML from non-code content
  let cleanedText = tempText
    // Remove HTML tags that might have been included in the response
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Handle pre/code blocks specially - preserve ALL content exactly
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]*>/g, '') // Now safe to remove HTML tags
    // Only clean up excessive whitespace outside of code blocks
    .replace(/(\n\s*){4,}/g, '\n\n\n') // Allow max 3 consecutive newlines
    .trim();
  
  // Restore protected code blocks
  codeBlockPlaceholders.forEach((code, index) => {
    cleanedText = cleanedText.replace(`__CODE_BLOCK_${index}__`, code);
    cleanedText = cleanedText.replace(`__INLINE_CODE_${index}__`, code);
  });
  
  return cleanedText
    // Headers (### Header, ## Header, # Header)
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-gray-800 dark:text-[#CDEAFC] mt-3 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-[#CDEAFC] mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-[#CDEAFC] mt-4 mb-3">$1</h1>')
    
    // Code blocks with triple backticks ```code``` - with copy button (PROCESS FIRST)
    .replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, language, code) => {
      const codeId = `code-block-${Date.now()}-${++codeBlockCounter}`;
      // Preserve ALL formatting - don't modify the code content at all, keep line breaks
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const detectedLanguage = language || 'text';
      return `<div class="code-container dark:bg-gray-900 bg-gray-900 mt-4 mb-4 rounded-lg overflow-hidden relative group max-w-full border border-gray-700"><div class="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700"><span class="text-xs text-gray-400 font-medium">${detectedLanguage}</span><button data-copy-target="${codeId}" class="copy-code-btn px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200" title="Copy code"><i class="far fa-copy mr-1"></i> Copy</button></div><pre id="${codeId}" class="p-4 font-cascadia max-w-full text-sm leading-relaxed" style="tab-size: 4; line-height: 1.5; overflow: hidden; white-space: pre-wrap; word-wrap: break-word;"><code class="language-${detectedLanguage} block text-gray-200">${escapedCode}</code></pre></div>`;
    })
    
    // Inline code `code` - with copy button for longer code (PROCESS SECOND)
    .replace(/`([^`]+)`/g, (match, code) => {
      const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Check if code has multiple lines or is significantly long
      const hasMultipleLines = code.includes('\n') || code.includes('\\n');
      const isLongCode = code.length > 50;
      
      // For multi-line or long code, create a block format
      if (hasMultipleLines || isLongCode) {
        const codeId = `inline-code-block-${Date.now()}-${++codeBlockCounter}`;
        return `<div class="code-container bg-gray-900 mt-3 mb-3 rounded-lg overflow-hidden relative group max-w-full"><button data-copy-target="${codeId}" class="copy-code-btn px-2 py-1 rounded text-xs absolute top-2 right-2 opacity-100 xl:opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gray-800 hover:bg-gray-700 text-white z-10" title="Copy code"><i class="far fa-copy mr-1"></i> Copy</button><pre id="${codeId}" class="p-4 font-cascadia max-w-full text-sm" style="tab-size: 4; overflow: hidden; white-space: pre-wrap; word-wrap: break-word;"><code class="text-gray-200 block">${escapedCode}</code></pre></div>`;
      }
      
      // For short single-line code, use inline format
      if (code.length > 20) {
        const codeId = `inline-code-${Date.now()}-${++codeBlockCounter}`;
        return `<span class="inline-flex items-center gap-1 dark:bg-gray-800 bg-gray-800 dark:text-gray-300 text-gray-200 px-2 py-1 rounded font-cascadia text-sm not-italic"><code id="${codeId}">${escapedCode}</code><button data-copy-target="${codeId}" class="copy-code-btn ml-1 p-0.5 dark:hover:bg-gray-700 hover:bg-gray-700 rounded transition-colors" title="Copy"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></span>`;
      }
      return `<code class="dark:bg-gray-800 bg-gray-800 dark:text-gray-300 text-gray-200 px-2 py-1 rounded font-cascadia text-sm not-italic">${escapedCode}</code>`;
    })
    
    // Bold text **text** (PROCESS AFTER CODE)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-[#CDEAFC]">$1</strong>')
    
    // Italic text *text* - avoid affecting code elements (PROCESS LAST for text formatting)
    .replace(/\*([^*<>]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
    
    // Links with markdown [text](url) and direct links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium" target="_blank">$1</a>')
    .replace(/🔗 Go to: (\/[\w\/\-]*)/g, '<a href="$1" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium" target="_blank">🔗 Go to: $1</a>')
    
    // Blockquotes > text
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300 my-2">$1</blockquote>')
    
    // Bullet points with dashes, asterisks, and plus
    .replace(/^[-*+] (.*$)/gm, '<div class="flex items-start my-1"><span class="text-blue-500 mr-2 mt-1">•</span><span class="flex-1">$1</span></div>')
    
    // Numbered lists
    .replace(/^(\d+)\. (.*$)/gm, '<div class="flex items-start my-1"><span class="text-blue-600 font-semibold mr-2 min-w-[1.5rem]">$1.</span><span class="flex-1">$2</span></div>')
    
    // Emojis at start of lines with enhanced styling
    .replace(/^(📚|💻|🔍|❓|🏠|📝|💡|🎓|⚡|🤖|📖|📊|🌐|🎯|🚀|⭐|🔥|💫) (.*$)/gm, '<div class="flex items-start my-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 rounded-lg"><span class="text-xl mr-3">$1</span><span class="flex-1">$2</span></div>')
    
    // Special Pikachu/Electric themed elements
    .replace(/⚡/g, '<span class="text-blue-500 animate-pulse">⚡</span>')
    .replace(/Pika pika!/g, '<span class="text-blue-600 font-bold animate-bounce">Pika pika!</span>')
    .replace(/Nutrinos/g, '<span class="text-green-600 font-semibold bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1 rounded">Nutrinos</span>')
    
    // Horizontal rules ---
    .replace(/^---$/gm, '<hr class="border-t-2 border-blue-200 dark:border-blue-600 my-4">')
    
    // Tables (basic support)
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim());
      return `<div class="grid grid-cols-${cells.length} gap-2 border border-gray-200 dark:border-gray-600 rounded p-2 my-2">${cells.map(cell => `<div class="p-1 text-sm">${cell}</div>`).join('')}</div>`;
    })
    
    // Line breaks (convert \n to <br> but preserve structure) - PROCESS LAST
    .replace(/\n\n/g, '<div className="my-3"></div>')
    .replace(/\n/g, '<br>');
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // Track if we should auto-scroll
  const [userSentMessage, setUserSentMessage] = useState(false); // Track if user just sent a message
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration status
  const [messageQuota, setMessageQuota] = useState({ count: 3, resetTime: null }); // Message quota for non-logged-in users
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hydration effect - runs only on client side
  useEffect(() => {
    // Add small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check for logged-in user
  useEffect(() => {
    // Only run on client side after hydration
    if (!isHydrated) return;

    // Add delay to prevent hydration issues
    const userCheckTimer = setTimeout(() => {
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
    }, 25); // Smaller delay for user check

    return () => clearTimeout(userCheckTimer);
  }, [isHydrated]);

  // Load chat history and message quota from localStorage on component mount
  useEffect(() => {
    // Only run on client side after hydration
    if (!isHydrated) return;

    // Add additional delay to ensure DOM is fully ready
    const loadTimer = setTimeout(() => {
      const loadChatHistory = () => {
        try {
          const savedMessages = localStorage.getItem('pikachu_chat_history');
          if (savedMessages) {
            const parsedMessages = JSON.parse(savedMessages);
            // Sanitize all loaded messages only if they're not already strings
            const sanitizedMessages = parsedMessages.map(msg => ({
              ...msg,
              text: typeof msg.text === 'string' ? msg.text : sanitizeMessageText(msg.text)
            }));
            setMessages(sanitizedMessages);
          } else {
            // If no history, start with welcome message
            const initializeWelcome = async () => {
              const welcomeText = await getPersonalizedWelcomeMessage();
              const welcomeMessage = {
                id: 1,
                text: welcomeText,
                sender: 'bot',
                timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
              };
              setMessages([welcomeMessage]);
              localStorage.setItem('pikachu_chat_history', JSON.stringify([welcomeMessage]));
            };
            initializeWelcome();
          }

          // Load message quota for non-logged-in users
          if (!currentUser) {
            const savedQuota = localStorage.getItem('pikachu_message_quota');
            if (savedQuota) {
              const quotaData = JSON.parse(savedQuota);
              const now = new Date().getTime();
              
              // Check if quota has reset (3 hours passed)
              if (quotaData.resetTime && now >= quotaData.resetTime) {
                // Reset quota
                const newQuota = { count: 3, resetTime: null };
                setMessageQuota(newQuota);
                localStorage.setItem('pikachu_message_quota', JSON.stringify(newQuota));
              } else {
                setMessageQuota(quotaData);
              }
            }
          } else {
            // Clear quota for logged-in users
            localStorage.removeItem('pikachu_message_quota');
            setMessageQuota({ count: 3, resetTime: null });
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Fallback to welcome message if localStorage fails
          const initializeFallbackWelcome = async () => {
            const welcomeText = await getPersonalizedWelcomeMessage();
            const welcomeMessage = {
              id: 1,
              text: welcomeText,
              sender: 'bot',
              timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
            };
            setMessages([welcomeMessage]);
          };
          initializeFallbackWelcome();
        }
      };

      loadChatHistory();
    }, 50); // Small delay after hydration

    return () => clearTimeout(loadTimer);
  }, [isHydrated, currentUser]);


  const sanitizeMessageText = (text) => {
    // If it's already a string, return as is
    if (typeof text === 'string') return text;
    
    // If it's null or undefined, return empty string
    if (text == null) return '';
    
    // If it's a number or boolean, convert to string
    if (typeof text === 'number' || typeof text === 'boolean') return String(text);
    
    // If it's an object, try to extract meaningful text
    if (typeof text === 'object') {
      // Check for common text properties
      if (text.message) return String(text.message);
      if (text.text) return String(text.text);
      if (text.value) return String(text.value);
      
      // Try toString() but avoid [object Object]
      if (text.toString && typeof text.toString === 'function') {
        const stringified = text.toString();
        if (stringified !== '[object Object]' && stringified !== '[object HTMLInputElement]') {
          return stringified;
        }
      }
      
      // Last resort - JSON stringify for debugging
      try {
        const jsonString = JSON.stringify(text);
        return jsonString !== '{}' ? jsonString : 'Error: Invalid message format';
      } catch (e) {
        return 'Error: Invalid message format';
      }
    }
    
    // Fallback to string conversion
    return String(text);
  };

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 0 && hour < 6) {
      return "Ghuma vhai please! ⚡ Rat 12 tar por, tomar ghum proyojon! 😴";
    } else if (hour >= 6 && hour < 12) {
      return "Good Morning ⚡ Sokal sokal uthe geche mama! Fresh feeling! 🌅";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon ⚡ Dupurer alo te kichu coding korbo? 🌞";
    } else if (hour >= 17 && hour < 21) {
      return "Good Evening ⚡ Shondha hoye geche, ektu relax koro! 🌆";
    } else {
      return "Good Night ⚡ Rat hoye geche mama, tara dekho! 🌙";
    }
  };

  // Function to check battery status and show warnings
  const getBatteryWarning = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        let batteryMessage = "";
        
        // Check if charging
        if (battery.charging) {
          batteryMessage += "\n\n🔋 **Battery Alert**: Device charging detected! Charger lagate lagate use korle battery life kharap hoye jabe! Ektu wait koro, charge complete houar por use koro. ⚡";
        }
        
        // Check low battery
        const batteryLevel = Math.round(battery.level * 100);
        if (batteryLevel < 20 && !battery.charging) {
          batteryMessage += `\n\n🪫 **Low Battery Warning**: Battery ${batteryLevel}%! Tara tari charger lagao vai, noyto mobile off hoye jabe! Emergency e backup rakhle bhalo hoto! ⚠️`;
        }
        
        return batteryMessage;
      }
    } catch (error) {
      console.log('Battery API not supported or permission denied');
    }
    return "";
  };

  // Function to get detailed battery information  
  const getBatteryInfo = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        const batteryLevel = Math.round(battery.level * 100);
        const chargingStatus = battery.charging ? 'Charging ⚡' : 'Not Charging 🔋';
        
        let batteryMessage = `**🔋 Battery Status:**\n\n`;
        batteryMessage += `**Level:** ${batteryLevel}%\n`;
        batteryMessage += `**Status:** ${chargingStatus}\n`;
        
        if (battery.chargingTime && battery.chargingTime !== Infinity) {
          const chargingTimeHours = Math.floor(battery.chargingTime / 3600);
          const chargingTimeMinutes = Math.floor((battery.chargingTime % 3600) / 60);
          batteryMessage += `**Charging Time:** ${chargingTimeHours}h ${chargingTimeMinutes}m\n`;
        }
        
        if (battery.dischargingTime && battery.dischargingTime !== Infinity) {
          const dischargingTimeHours = Math.floor(battery.dischargingTime / 3600);
          const dischargingTimeMinutes = Math.floor((battery.dischargingTime % 3600) / 60);
          batteryMessage += `**Remaining Time:** ${dischargingTimeHours}h ${dischargingTimeMinutes}m\n`;
        }
        
        // Add warnings
        if (battery.charging) {
          batteryMessage += `\n⚠️ **Pikachu's Advice:** Device charging detected! Charger lagate lagate use korle battery life damage hoye jabe! Ektu wait koro, charge complete houar por use koro. Health er jonno better! ⚡`;
        }
        
        if (batteryLevel < 20 && !battery.charging) {
          batteryMessage += `\n🪫 **Low Battery Warning:** Battery khub kom! Tara tari charger lagao vai, noyto mobile off hoye jabe! Emergency backup ready rakho! ⚠️`;
        } else if (batteryLevel < 50 && !battery.charging) {
          batteryMessage += `\n🔋 **Battery Reminder:** Battery half hoye geche, charger er kothা ভাবো! ⚡`;
        } else if (batteryLevel > 90) {
          batteryMessage += `\n✅ **Good Battery:** Battery besh valo ache! Continue korte paro! 😎`;
        }
        
        return batteryMessage;
      } else {
        return `🔋 **Battery API not supported** on this device/browser. Tomar browser Battery API support kore na mama! Chrome/Edge e try koro! ⚡`;
      }
    } catch (error) {
      console.error('Battery check error:', error);
      return `⚡ **Battery Check Failed:** Permission nai ba error hoyeche! Browser settings check koro! 🔧`;
    }
  };

  // Function to get personalized welcome message
  const getPersonalizedWelcomeMessage = async () => {
    const timeGreeting = getTimeBasedGreeting();
    const batteryWarning = await getBatteryWarning();
    
    if (currentUser && currentUser.name) {
      const firstName = currentUser.name.split(' ')[0];
      return `${timeGreeting}\n\nYoooo ${firstName} mama! ⚡ Ami Pikachu, tumader chaotic digital classmate! Dekho ${firstName}, RUET CSE Archive er shob kichu jani, Nutrinos system theke shuru kore Section C er shob ghotona! Aj ki korbo? Sikhan vai naki kibabe sombob? 😎${batteryWarning}`;
    }
    return `${timeGreeting}\n\n${AI_CONFIG.behavior.welcomeMessage || 'Pika pika! ⚡ Hey there! I\'m Pikachu, your coding assistant!'}${batteryWarning}`;
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
    if (chatBodyRef.current && (shouldAutoScroll || userSentMessage)) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      setUserSentMessage(false); // Reset the flag after scrolling
    }
  }, [messages, shouldAutoScroll, userSentMessage]);

  // Track scroll position to determine if user is at bottom
  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBody;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setShouldAutoScroll(isNearBottom);
    };

    chatBody.addEventListener('scroll', handleScroll);
    return () => chatBody.removeEventListener('scroll', handleScroll);
  }, [isOpen]); // Re-attach when chat opens

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

  // Focus input when chat opens and scroll to bottom
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
        // Scroll to bottom when chat opens
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          setShouldAutoScroll(true); // Reset auto-scroll when opening
        }
      }, 100);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Function to clear chat history
  const clearChatHistory = async () => {
    if (window.confirm('Ami ki chat history clear kore dibo? Eta undo kora jabe na! 🤔')) {
      try {
        localStorage.removeItem('pikachu_chat_history');
        const welcomeText = await getPersonalizedWelcomeMessage();
        const welcomeMessage = {
          id: Date.now(),
          text: welcomeText,
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

  // Function to check if user can send message (quota system)
  const canSendMessage = () => {
    // Logged-in users have unlimited messages
    if (currentUser) return { allowed: true };
    
    // Non-logged-in users have quota system
    const now = new Date().getTime();
    
    // Check if quota has reset (3 hours passed)
    if (messageQuota.resetTime && now >= messageQuota.resetTime) {
      // Reset quota
      const newQuota = { count: 3, resetTime: null };
      setMessageQuota(newQuota);
      localStorage.setItem('pikachu_message_quota', JSON.stringify(newQuota));
      return { allowed: true };
    }
    
    // Check if user has messages left
    if (messageQuota.count > 0) {
      return { allowed: true };
    }
    
    // Calculate remaining time
    const remainingTime = messageQuota.resetTime ? messageQuota.resetTime - now : 0;
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      allowed: false, 
      resetTime: messageQuota.resetTime,
      remainingTime: { hours, minutes }
    };
  };

  // Function to use a message from quota
  const useMessageQuota = () => {
    if (currentUser) return; // No quota for logged-in users
    
    const now = new Date().getTime();
    const newCount = messageQuota.count - 1;
    let newResetTime = messageQuota.resetTime;
    
    // If this is the last message, set reset time to 3 hours from now
    if (newCount === 0) {
      newResetTime = now + (3 * 60 * 60 * 1000); // 3 hours in milliseconds
    }
    
    const newQuota = { count: newCount, resetTime: newResetTime };
    setMessageQuota(newQuota);
    localStorage.setItem('pikachu_message_quota', JSON.stringify(newQuota));
  };

  const sendMessage = async (customMessage = null) => {
    try {
      // Check message quota first
      const quotaCheck = canSendMessage();
      if (!quotaCheck.allowed) {
        const { hours, minutes } = quotaCheck.remainingTime;
        const quotaMessage = {
          id: Date.now(),
          text: `⚡ **Message Limit Reached!** 🚫\n\n**Hey there!** Tumi guest user, tai 3 ta message er limit ache every 3 hours e! \n\n**⏰ Wait Time:** ${hours}h ${minutes}m baki ache!\n\n**💡 Solution:** \n- **Login koro** unlimited messages er jonno! 🔑\n- **Noile wait koro** ${hours > 0 ? `${hours} hour ${minutes} minute` : `${minutes} minute`} 😊\n\n**🎯 Pro Tip:** Account create korle unlimited chat korte parba Pikachu er shathe! ⚡`,
          sender: 'bot',
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        };
        setMessages(prev => [...prev, quotaMessage]);
        return;
      }

      // Use quota for non-logged-in users
      useMessageQuota();

      // Get the raw message first - handle mobile input properly
      let rawMessage;
      if (customMessage !== null) {
        rawMessage = customMessage;
      } else {
        // For mobile compatibility, ensure we get the actual string value
        rawMessage = typeof inputMessage === 'string' ? inputMessage.trim() : String(inputMessage || '').trim();
      }
      
      // Mobile debugging
      console.log('sendMessage called with:', { customMessage, inputMessage, rawMessage, type: typeof rawMessage });
      
      // Double-check we have a clean string
      const message = typeof rawMessage === 'string' && rawMessage.length > 0 ? rawMessage : sanitizeMessageText(rawMessage);
      
      // Additional mobile validation
      if (!message || message === '[object Object]' || message === 'Error: Invalid message format' || message.length === 0 || isLoading) {
        console.warn('Invalid message detected:', { message, rawMessage, inputMessage });
        return;
      }

      // Check for battery command
      if (message.toLowerCase().includes('battery') || message.toLowerCase().includes('charge')) {
        const batteryInfo = await getBatteryInfo();
        const batteryMessage = {
          id: Date.now(),
          text: batteryInfo,
          sender: 'bot',
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        };
        setMessages(prev => [...prev, {
          id: Date.now() - 1,
          text: message,
          sender: 'user',
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        }, batteryMessage]);
        setUserSentMessage(true); // Flag that user sent a message
        if (!customMessage) setInputMessage('');
        return;
      }

      // Add user message
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      };

      setMessages(prev => [...prev, userMessage]);
      setUserSentMessage(true); // Flag that user sent a message, so we should auto-scroll
      if (!customMessage) setInputMessage(''); // Only clear input if it's a manual message
      setIsLoading(true);

      // Prepare chat history for API (limit to recent messages)
      const recentMessages = messages.slice(-AI_CONFIG.behavior.maxMessages);
      const chatHistory = recentMessages.map(msg => ({
        text: typeof msg.text === 'string' ? msg.text : sanitizeMessageText(msg.text),
        sender: msg.sender
      }));

      const response = await fetch(AI_CONFIG.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
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
            text: typeof data.message === 'string' ? data.message : sanitizeMessageText(data.message),
            sender: 'bot',
            timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, Math.max(500, Math.min(data.message?.length * 20 || 1000, 2000))); // Dynamic delay based on message length
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: AI_CONFIG.behavior.errorMessage || 'Bzzt! ⚡ Something went wrong. Please try again!',
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
      // Ensure we're passing the current input value, not the event
      sendMessage();
    }
  };

  // Mobile-friendly send handler
  const handleSendClick = (e) => {
    // Prevent any event object from being passed
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  };

  // Enhanced input change handler for mobile compatibility
  const handleInputChange = (e) => {
    // Extract the actual string value, avoiding any object references
    const value = e.target?.value || '';
    
    // Mobile debugging - log if we're getting unexpected types
    if (typeof value !== 'string') {
      console.warn('Mobile input warning: Expected string but got:', typeof value, value);
    }
    
    setInputMessage(String(value));
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
      try {
        const fileContent = String(e.target.result); // Ensure it's a string
        const fileInfo = {
          name: String(file.name),
          size: Number(file.size),
          type: String(fileExtension),
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
      } catch (error) {
        console.error('Error processing file:', error);
        alert('⚡ Bzzt! Error processing file. Please try again!');
      }
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

  // Only render after hydration to prevent SSR mismatch
  if (!isHydrated) {
    return null; // Don't show anything during SSR
  }

  return (
    <>
      {/* Floating Chat Button - Available for all users */}
      <button
        id="chatToggleBtn"
        onClick={toggleChat}
        className="fixed bottom-5 right-5 w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 hover:scale-110 hover:shadow-xl"
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
        className={`fixed bottom-28 right-5 w-80 sm:w-96 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-[#152732] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 transform-gpu ${
          isOpen 
            ? 'scale-100 opacity-100' 
            : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
          className="p-3 h-80 overflow-y-auto space-y-2 text-sm bg-gray-50 dark:bg-[#152732] ai-chat-container"
        >
          {messages.map((message) => (
            <div key={message.id}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl word-wrap break-words ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-[#CDEAFC] border border-gray-200 dark:border-gray-600 shadow-sm'
                }`}
              >
                {message.sender === 'bot' ? (
                  <div 
                    className="ai-message prose prose-sm max-w-none prose-blue prose-headings:text-gray-900 dark:prose-headings:text-[#CDEAFC] prose-code:text-blue-800 dark:prose-code:text-blue-300 prose-code:bg-blue-100 dark:prose-code:bg-blue-900/30"
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
                className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                  message.sender === 'user' ? 'text-right' : ''
                }`}
              >
                {message.timestamp}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-fadeIn">
              <div className="bg-white text-gray-800 border border-gray-200 max-w-[80%] p-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-0"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-150"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-300"></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 animate-pulse">⚡ Pikachu is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scroll to Bottom Button - appears when user is scrolled up */}
        {!shouldAutoScroll && (
          <div className="absolute bottom-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (chatBodyRef.current) {
                  chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
                  setShouldAutoScroll(true);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-1 text-xs"
              title="Scroll to bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>New</span>
            </button>
          </div>
        )}

        {/* File Upload Info */}
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Upload code files (.txt, .c, .cpp, .py, .js, .html, .css, .java) for bug analysis & tips! Max 100KB ⚡</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#152732] ai-chat-input-area">
          <div className="flex items-center w-full bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-30 transition-all duration-200">
            {/* File upload button - Attachment Icon */}
            <button
              onClick={triggerFileUpload}
              disabled={isLoading || (!currentUser && messageQuota.count === 0)}
              className="ml-3 p-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Upload code file (max 100KB)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Text Input Box */}
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                !currentUser && messageQuota.count === 0 
                  ? "Login to continue chatting..." 
                  : AI_CONFIG.behavior.placeholder
              }
              disabled={isLoading || (!currentUser && messageQuota.count === 0)}
              className="flex-1 text-sm px-4 py-3 bg-transparent border-none focus:outline-none disabled:opacity-50 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-[#CDEAFC]"
            />

            {/* Send button - Airplane Icon */}
            <button
              onClick={handleSendClick}
              disabled={!inputMessage.trim() || isLoading || (!currentUser && messageQuota.count === 0)}
              className="mr-3 p-2 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 disabled:bg-gray-300"
              title="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.c,.cpp,.py,.js,.html,.css,.java"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Message quota indicator for non-logged-in users */}
        {!currentUser && (
          <div className="px-3 py-2 bg-white dark:bg-[#152732] border-t border-gray-100 dark:border-gray-700 text-xs text-center">
            {messageQuota.count > 0 ? (
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ⚡ {messageQuota.count} messages left | 
                <span className="text-blue-600 ml-1">Login for unlimited! 🔑</span>
              </span>
            ) : (
              <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full">
                🚫 Message limit reached | Wait {Math.floor((messageQuota.resetTime - new Date().getTime()) / (1000 * 60 * 60))}h {Math.floor(((messageQuota.resetTime - new Date().getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2 bg-white dark:bg-[#152732] border-t border-gray-100 dark:border-gray-700">
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
          overflow: hidden;
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
        
        /* Enhanced code block styling with full text wrapping */
        .ai-message pre {
          max-width: 100%;
          overflow: hidden;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          word-break: normal !important;
          background: #1f2937 !important;
          color: #e5e7eb !important;
          border-radius: 0.5rem;
          line-height: 1.5 !important;
          display: block !important;
        }
        
        /* Fix dangerouslySetInnerHTML code rendering */
        .ai-message div[class*="code-container"] {
          background: #1f2937 !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
          margin: 16px 0 !important;
        }
        
        .ai-message div[class*="code-container"] pre {
          background: #1f2937 !important;
          margin: 0 !important;
          padding: 16px !important;
          border-radius: 0 !important;
        }
        
        .ai-message div[class*="code-container"] code {
          background: transparent !important;
          color: #e5e7eb !important;
          display: block !important;
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          word-break: normal !important;
          line-height: 1.5 !important;
        }
        
        /* Enhanced code container styling */
        .code-container {
          position: relative;
          max-width: 100%;
          overflow: hidden;
          margin: 16px 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        /* Inline code block styling */
        .code-container pre {
          margin: 0 !important;
          border-radius: 0 0 8px 8px !important;
        }
        
        /* Better vertical spacing for code elements */
        .ai-message .code-container + .code-container {
          margin-top: 12px;
        }
        
        .ai-message .code-container + p,
        .ai-message p + .code-container {
          margin-top: 16px;
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
          line-height: 1.6 !important;
          font-variant-ligatures: normal !important;
          display: block !important;
        }
        
        /* Ensure pre element preserves ALL whitespace and line breaks */
        .ai-message pre {
          white-space: pre !important;
          word-wrap: normal !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        
        /* Force code containers to maintain proper formatting */
        .code-container pre,
        .code-container code {
          white-space: pre !important;
          line-height: 1.6 !important;
          font-family: 'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        
        /* Loading Animation Fixes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animation-delay-0 {
          animation-delay: 0ms;
        }
        
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        /* Force immediate animation start */
        .animate-bounce {
          animation: bounce 1s infinite;
          animation-fill-mode: both;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        /* Enhanced mobile responsiveness */
        @media (max-width: 640px) {
          #chatPopup {
            width: calc(100vw - 10px) !important;
            right: 5px !important;
            bottom: 5rem !important;
            max-width: none !important;
            left: 5px !important;
            position: fixed !important;
          }
          #chatPopup > div:nth-child(2) {
            height: 60vh !important;
            max-height: 400px !important;
          }
          
          /* Adjust button sizes for mobile */
          #chatToggleBtn {
            width: 56px !important;
            height: 56px !important;
            bottom: 10px !important;
            right: 10px !important;
          }
          
          /* Adjust input area for mobile */
          .ai-chat-container {
            font-size: 14px !important;
          }
          
          /* Better input area on mobile */
          .ai-chat-input-area {
            padding: 12px !important;
          }
          
          .ai-chat-input-area > div {
            min-height: 48px !important;
          }
          
          .ai-chat-input-area input {
            font-size: 16px !important; /* Prevents zoom on iOS */
            padding: 12px 8px !important;
          }
          
          /* Better code block handling on mobile */
          .ai-message pre {
            max-height: 250px !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
            padding: 12px !important;
          }
          
          .ai-message code {
            font-size: 13px !important;
          }
          
          /* Better scrollbars on mobile */
          .ai-message pre::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          
          /* Code container improvements on mobile */
          .code-container {
            margin: 12px 0 !important;
            border-radius: 6px !important;
          }
          
          /* Inline code blocks on mobile */
          .code-container pre {
            border-radius: 0 0 6px 6px !important;
          }
        }
        
        @media (max-width: 480px) {
          #chatPopup {
            width: calc(100vw - 8px) !important;
            right: 4px !important;
            left: 4px !important;
            bottom: 4.5rem !important;
          }
          
          #chatToggleBtn {
            width: 52px !important;
            height: 52px !important;
            bottom: 8px !important;
            right: 8px !important;
          }
          
          /* Enhanced mobile input styling */
          .ai-chat-input-area {
            padding: 10px !important;
          }
          
          .ai-chat-input-area > div {
            min-height: 44px !important;
          }
          
          .ai-chat-input-area button {
            width: 40px !important;
            height: 40px !important;
            padding: 8px !important;
          }
          
          .ai-chat-input-area input {
            font-size: 16px !important;
            padding: 10px 6px !important;
          }
          
          /* Mobile code improvements */
          .ai-message pre {
            max-height: 200px !important;
            font-size: 12px !important;
            padding: 8px !important;
          }
          
          .ai-message code {
            font-size: 12px !important;
          }
          
          .code-container {
            margin: 8px 0 !important;
          }
        }
      `}</style>
    </>
  );
}
