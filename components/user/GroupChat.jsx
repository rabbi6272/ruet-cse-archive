"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  push,
  set,
  update,
  get,
  orderByKey,
  limitToLast,
  serverTimestamp,
} from "firebase/database";
import toast from "react-hot-toast";
import { getUserGroup, isUserInGroup, getGroupName } from "@/lib/group-utils";
import EmojiPanel from "@/components/ui/EmojiPanel";
import MessageReactions from "@/components/ui/MessageReactions";
import { PollCreationModal, PollEditModal, PollDisplay } from "./PollComponent";
import AuthUtils from "@/lib/auth-utils-secure";

// Link detection and preview utilities
const SUPPORTED_PLATFORMS = {
  YOUTUBE: 'youtube',
  CODEFORCES: 'codeforces',
  ATCODER: 'atcoder',
  LEETCODE: 'leetcode',
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  GOOGLE: 'google',
  FACEBOOK: 'facebook'
};

// URL patterns for different platforms
const URL_PATTERNS = {
  [SUPPORTED_PLATFORMS.YOUTUBE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
  ],
  [SUPPORTED_PLATFORMS.CODEFORCES]: [
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/(problemset\/problem|contest|gym)\/[\w\/-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/blog\/entry\/[\d]+/i
  ],
  [SUPPORTED_PLATFORMS.ATCODER]: [
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+\/tasks\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/users\/[\w-]+/i
  ],
  [SUPPORTED_PLATFORMS.LEETCODE]: [
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/discuss\/[\w\/-]+/i
  ],
  [SUPPORTED_PLATFORMS.GITHUB]: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+(?:\/.*)?/i
  ],
  [SUPPORTED_PLATFORMS.LINKEDIN]: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/[\w:-]+/i
  ],
  [SUPPORTED_PLATFORMS.GOOGLE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:docs|drive|forms|sheets|slides)\.google\.com\/[\w\/\-\?=&]+/i,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/[\w\/\-\?=&]+/i
  ],
  [SUPPORTED_PLATFORMS.FACEBOOK]: [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/[\w.-]+/i,
    /(?:https?:\/\/)?(?:www\.)?m\.facebook\.com\/[\w.-]+/i
  ]
};

// Function to detect and parse links in text
const detectLinks = (text) => {
  const links = [];
  const foundUrls = new Set(); // To avoid duplicates
  
  // Check each platform's patterns
  Object.entries(URL_PATTERNS).forEach(([platform, patterns]) => {
    patterns.forEach(pattern => {
      // Use global flag to find all matches
      const globalPattern = new RegExp(pattern.source, 'gi');
      let match;
      
      while ((match = globalPattern.exec(text)) !== null) {
        const url = match[0];
        const normalizedUrl = url.toLowerCase();
        
        // Avoid duplicate URLs
        if (!foundUrls.has(normalizedUrl)) {
          foundUrls.add(normalizedUrl);
          
          // Extract video ID for YouTube
          let videoId = null;
          if (platform === SUPPORTED_PLATFORMS.YOUTUBE) {
            videoId = getYouTubeVideoId(url);
          }
          
          const linkInfo = {
            platform,
            url: url,
            fullMatch: match[0],
            videoId: videoId
          };
          
          links.push(linkInfo);
        }
      }
    });
  });
  
  return links;
};

// Function to get YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Function to get platform icon
const getPlatformIcon = (platform) => {
  const icons = {
    [SUPPORTED_PLATFORMS.YOUTUBE]: '🎥',
    [SUPPORTED_PLATFORMS.CODEFORCES]: '💻',
    [SUPPORTED_PLATFORMS.ATCODER]: '🏆',
    [SUPPORTED_PLATFORMS.LEETCODE]: '🧩',
    [SUPPORTED_PLATFORMS.GITHUB]: '🐙',
    [SUPPORTED_PLATFORMS.LINKEDIN]: '💼',
    [SUPPORTED_PLATFORMS.GOOGLE]: '📄',
    [SUPPORTED_PLATFORMS.FACEBOOK]: '📘'
  };
  return icons[platform] || '🔗';
};

// Function to get platform name
const getPlatformName = (platform) => {
  const names = {
    [SUPPORTED_PLATFORMS.YOUTUBE]: 'YouTube',
    [SUPPORTED_PLATFORMS.CODEFORCES]: 'Codeforces',
    [SUPPORTED_PLATFORMS.ATCODER]: 'AtCoder',
    [SUPPORTED_PLATFORMS.LEETCODE]: 'LeetCode',
    [SUPPORTED_PLATFORMS.GITHUB]: 'GitHub',
    [SUPPORTED_PLATFORMS.LINKEDIN]: 'LinkedIn',
    [SUPPORTED_PLATFORMS.GOOGLE]: 'Google',
    [SUPPORTED_PLATFORMS.FACEBOOK]: 'Facebook'
  };
  return names[platform] || 'Link';
};

// Component for rendering YouTube video embed
const YouTubeEmbed = ({ videoId, isOwnMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="mt-2 mb-2">
        <div className={`border rounded-lg p-3 ${
          isOwnMessage 
            ? 'border-indigo-300 bg-indigo-700/30' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎥</span>
            <span className={`text-sm font-medium ${
              isOwnMessage 
                ? 'text-indigo-100' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              YouTube Video (Error loading)
            </span>
          </div>
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:underline ${
              isOwnMessage 
                ? 'text-indigo-200' 
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-2">
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <i className="fas fa-spinner fa-spin text-gray-500 text-lg"></i>
              <span className="text-xs sm:text-sm text-gray-500">Loading video...</span>
            </div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs hover:underline inline-flex items-center gap-1 ${
            isOwnMessage 
              ? 'text-indigo-200 hover:text-indigo-100' 
              : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
          }`}
        >
          <span className="hidden xs:inline">Watch on YouTube</span>
          <span className="xs:hidden">YouTube</span>
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
          </svg>
        </a>
        <span className={`text-xs ${
          isOwnMessage 
            ? 'text-indigo-200' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          🎥 YouTube Video
        </span>
      </div>
    </div>
  );
};

// Component for rendering link preview
const LinkPreview = ({ link, isOwnMessage }) => {
  const platform = link.platform;
  const platformName = getPlatformName(platform);
  const platformIcon = getPlatformIcon(platform);
  
  // Extract meaningful information from URL
  const getUrlInfo = (url, platform) => {
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
    
    switch (platform) {
      case SUPPORTED_PLATFORMS.GITHUB:
        const githubMatch = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
        if (githubMatch) {
          return `${githubMatch[1]}/${githubMatch[2]}`;
        }
        break;
      case SUPPORTED_PLATFORMS.LEETCODE:
        const leetcodeMatch = url.match(/leetcode\.com\/problems\/([\w-]+)/);
        if (leetcodeMatch) {
          return `Problem: ${leetcodeMatch[1].replace(/-/g, ' ')}`;
        }
        break;
      case SUPPORTED_PLATFORMS.CODEFORCES:
        if (url.includes('/problemset/problem/')) {
          const cfMatch = url.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/);
          if (cfMatch) {
            return `Problem ${cfMatch[1]}${cfMatch[2]}`;
          }
        } else if (url.includes('/contest/')) {
          const contestMatch = url.match(/\/contest\/(\d+)/);
          if (contestMatch) {
            return `Contest ${contestMatch[1]}`;
          }
        }
        break;
      case SUPPORTED_PLATFORMS.ATCODER:
        if (url.includes('/contests/')) {
          const atcoderMatch = url.match(/\/contests\/([\w-]+)(?:\/tasks\/([\w-]+))?/);
          if (atcoderMatch) {
            if (atcoderMatch[2]) {
              return `${atcoderMatch[1]} - ${atcoderMatch[2]}`;
            } else {
              return `Contest: ${atcoderMatch[1]}`;
            }
          }
        }
        break;
      case SUPPORTED_PLATFORMS.LINKEDIN:
        if (url.includes('/in/')) {
          const linkedinMatch = url.match(/\/in\/([\w-]+)/);
          if (linkedinMatch) {
            return `Profile: ${linkedinMatch[1]}`;
          }
        } else if (url.includes('/company/')) {
          const companyMatch = url.match(/\/company\/([\w-]+)/);
          if (companyMatch) {
            return `Company: ${companyMatch[1]}`;
          }
        }
        break;
    }
    
    return cleanUrl.length > 50 ? cleanUrl.substring(0, 50) + '...' : cleanUrl;
  };
  
  const urlInfo = getUrlInfo(link.url, platform);
  
  return (
    <div className="mt-2 mb-2">
      <div className={`border rounded-lg p-3 transition-colors hover:bg-opacity-80 ${
        isOwnMessage 
          ? 'border-indigo-300 bg-indigo-700/30 hover:bg-indigo-700/40' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{platformIcon}</span>
          <span className={`text-sm font-medium ${
            isOwnMessage 
              ? 'text-indigo-100' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {platformName}
          </span>
        </div>
        <div className="space-y-1">
          <p className={`text-sm font-medium ${
            isOwnMessage 
              ? 'text-indigo-100' 
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            {urlInfo}
          </p>
          <a 
            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs break-all hover:underline inline-flex items-center gap-1 ${
              isOwnMessage 
                ? 'text-indigo-200 hover:text-indigo-100' 
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
            }`}
          >
            Open link
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

const GroupChat = ({ userRoll, userName, isOpen, onClose, onUnreadCountChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});
  const [typingStates, setTypingStates] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageReadStatus, setMessageReadStatus] = useState({});
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [userGroup, setUserGroup] = useState(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [swipeState, setSwipeState] = useState({ startX: 0, currentX: 0, messageId: null, swiping: false });
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  
  // Long press and emoji panel state for mobile
  const [longPressState, setLongPressState] = useState({ 
    timer: null, 
    messageId: null, 
    isLongPressing: false,
    activeMessagePanel: null // Track which message has active emoji panel
  });
  
  // Mention system state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Poll-related state
  const [polls, setPolls] = useState([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPollHistory, setShowPollHistory] = useState(false);

  // Get user's group on component mount
  useEffect(() => {
    if (userRoll) {
      const group = getUserGroup(userRoll);
      if (group) {
        setUserGroup(group);
      } else {
        toast.error("You are not assigned to any group");
        onClose();
      }
    }
  }, [userRoll, onClose]);

  // Convert name to proper case
  const toProperCase = (name) => {
    if (!name || typeof name !== 'string') return name;
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get mention suggestions
  const getMentionSuggestions = (searchText = "") => {
    if (!userGroup) return [];
    
    const suggestions = [
      {
        id: 'everyone',
        name: 'everyone',
        displayName: 'Everyone',
        roll: 'everyone',
        isEveryone: true
      }
    ];
    
    // Add all group members except current user
    userGroup.participants.forEach(roll => {
      if (roll !== userRoll) {
        const name = userGroup.participantNames[roll] || roll;
        suggestions.push({
          id: roll,
          name: name.toLowerCase(),
          displayName: toProperCase(name),
          roll: roll,
          isEveryone: false
        });
      }
    });
    
    // Filter based on search text
    if (searchText.trim()) {
      return suggestions.filter(suggestion => 
        suggestion.name.includes(searchText.toLowerCase()) || 
        suggestion.roll.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return suggestions;
  };

  // Handle mention input
  const handleMentionInput = (inputValue, cursorPos) => {
    const beforeCursor = inputValue.substring(0, cursorPos);
    const afterCursor = inputValue.substring(cursorPos);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      const isAtValidPosition = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
      
      if (isAtValidPosition) {
        // Extract search text after @
        const searchText = beforeCursor.substring(lastAtIndex + 1);
        
        // Check if search text contains spaces (if so, it's not a valid mention)
        if (!searchText.includes(' ') && !afterCursor.startsWith(' ')) {
          const suggestions = getMentionSuggestions(searchText);
          setFilteredMentions(suggestions);
          setMentionSearchText(searchText);
          setMentionCursorPosition(lastAtIndex);
          setSelectedMentionIndex(0);
          setShowMentionDropdown(suggestions.length > 0);
          return;
        }
      }
    }
    
    // Hide dropdown if no valid mention context
    setShowMentionDropdown(false);
    setMentionSearchText("");
    setFilteredMentions([]);
  };

  // Insert mention
  const insertMention = (mention) => {
    const input = messageInputRef.current;
    if (!input) return;
    
    const beforeMention = newMessage.substring(0, mentionCursorPosition);
    const afterMention = newMessage.substring(mentionCursorPosition + 1 + mentionSearchText.length);
    
    const mentionText = mention.isEveryone ? '@everyone' : `@${mention.displayName}`;
    const newText = beforeMention + mentionText + ' ' + afterMention;
    
    setNewMessage(newText);
    setShowMentionDropdown(false);
    setMentionSearchText("");
    setFilteredMentions([]);
    
    // Focus input and set cursor after mention
    setTimeout(() => {
      const newCursorPos = beforeMention.length + mentionText.length + 1;
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation in mention dropdown
  const handleMentionKeyDown = (e) => {
    if (!showMentionDropdown) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMentions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMentions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredMentions[selectedMentionIndex]) {
          insertMention(filteredMentions[selectedMentionIndex]);
        }
        break;
      case 'Escape':
        setShowMentionDropdown(false);
        setMentionSearchText("");
        setFilteredMentions([]);
        break;
    }
  };

  // Parse mentions in message text for display
  const parseMentions = (text) => {
    if (!text || !userGroup) return text;
    
    // Replace @everyone mentions
    let parsedText = text.replace(/@everyone/g, '<span class="mention everyone">@everyone</span>');
    
    // Replace user mentions
    userGroup.participants.forEach(roll => {
      if (roll !== userRoll) {
        const name = userGroup.participantNames[roll];
        if (name) {
          const displayName = toProperCase(name);
          const mentionRegex = new RegExp(`@${displayName}\\b`, 'gi');
          parsedText = parsedText.replace(mentionRegex, `<span class="mention user" data-roll="${roll}">@${displayName}</span>`);
        }
      }
    });
    
    return parsedText;
  };

  // Safe update wrapper
  const safeUpdate = async (dbRef, updateData) => {
    try {
      if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
        console.warn("Invalid update data:", updateData);
        return;
      }
      
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => value !== null && value !== undefined)
      );
      
      if (Object.keys(filteredData).length === 0) {
        console.warn("No valid data to update");
        return;
      }
      
      await update(dbRef, filteredData);
    } catch (error) {
      console.error("Error in safeUpdate:", error);
      throw error;
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Track the last message to only scroll on new messages, not reactions
  const lastMessageRef = useRef(null);
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (userGroup && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Initial scroll when chat opens
      if (!hasInitialScrolled.current) {
        scrollToBottom();
        lastMessageRef.current = latestMessage;
        hasInitialScrolled.current = true;
        return;
      }
      
      // Only scroll if this is actually a new message (not just a reaction update)
      if (!lastMessageRef.current || 
          (latestMessage && latestMessage.id !== lastMessageRef.current.id)) {
        // This is a new message, scroll to bottom
        scrollToBottom();
        lastMessageRef.current = latestMessage;
      }
      // If it's the same message ID but different data, it's likely a reaction update
      // so we don't scroll
    }
  }, [messages, userGroup]);

  // Reset scroll tracking when chat changes
  useEffect(() => {
    hasInitialScrolled.current = false;
    lastMessageRef.current = null;
  }, [userGroup]);

  // Track user presence
  useEffect(() => {
    if (!userRoll || !isOpen || !userGroup) return;

    // Set user as online in group
    const userPresenceRef = ref(db, `groupPresence/${userGroup.id}/${userRoll}`);
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp(),
      name: userName || "Unknown",
    };

    set(userPresenceRef, presenceData).catch(console.error);

    // Listen for presence changes in this group
    const presenceRef = ref(db, `groupPresence/${userGroup.id}`);
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const activeUsersMap = {};
      
      Object.entries(presenceData).forEach(([roll, data]) => {
        if (roll !== userRoll && data) {
          activeUsersMap[roll] = {
            online: data.online || false,
            lastSeen: data.lastSeen,
            name: data.name || "Unknown",
          };
        }
      });
      
      setActiveUsers(activeUsersMap);
    });

    // Set user offline on component unmount
    const handleOffline = () => {
      set(userPresenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
        name: userName || "Unknown",
      }).catch(console.error);
    };

    return () => {
      handleOffline();
      unsubscribePresence();
    };
  }, [userRoll, userName, isOpen, userGroup]);

  // Load messages for the group
  useEffect(() => {
    if (!userGroup) return;

    const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
    const messagesQuery = query(messagesRef, orderByKey(), limitToLast(20));

    const unsubscribeMessages = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const messagesList = Object.entries(data).map(([id, message]) => ({
        id,
        ...message,
      }));
      setMessages(messagesList);
      
      // Check if there are more messages
      if (Object.keys(data).length >= 20) {
        setShowOlderMessages(true);
      } else {
        setShowOlderMessages(false);
      }
    });

    return () => unsubscribeMessages();
  }, [userGroup]);

  // Load polls
  useEffect(() => {
    if (!userGroup) return;

    const pollsRef = ref(db, `groupPolls/${userGroup.id}`);
    const unsubscribePolls = onValue(pollsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const pollsList = Object.entries(data).map(([id, poll]) => ({
        id,
        ...poll,
      })).sort((a, b) => b.createdAt - a.createdAt);
      
      setPolls(pollsList);
    });

    return () => unsubscribePolls();
  }, [userGroup]);

  // Track typing status
  useEffect(() => {
    if (!userGroup || !userRoll) return;

    const typingRef = ref(db, `groupTyping/${userGroup.id}`);
    
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTypingStates(data);
    }, (error) => {
      console.error("Error listening to typing status:", error);
    });

    return () => {
      unsubscribeTyping();
      if (userGroup?.id && userRoll) {
        set(ref(db, `groupTyping/${userGroup.id}/${userRoll}`), null).catch(console.error);
      }
    };
  }, [userGroup, userRoll]);

  // Track unread count
  useEffect(() => {
    if (!userRoll || !isOpen || !userGroup) return;

    const unreadRef = ref(db, `groupUnreadCounts/${userGroup.id}/${userRoll}`);
    
    const unsubscribeUnread = onValue(unreadRef, (snapshot) => {
      const count = snapshot.val() || 0;
      setUnreadCount(count);
      
      // Notify parent component about unread count change
      if (onUnreadCountChange) {
        onUnreadCountChange(count);
      }
    }, (error) => {
      console.error("Error listening to unread count:", error);
    });

    return () => unsubscribeUnread();
  }, [userRoll, isOpen, userGroup]);

  // Track message read status
  useEffect(() => {
    if (!userGroup || !userRoll) return;

    const readStatusRef = ref(db, `groupMessageReadStatus/${userGroup.id}`);
    
    const unsubscribeReadStatus = onValue(readStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMessageReadStatus(data);
    }, (error) => {
      console.error("Error listening to message read status:", error);
    });

    return () => unsubscribeReadStatus();
  }, [userGroup, userRoll]);

  // Mark messages as read when group is active
  useEffect(() => {
    if (!userGroup || !userRoll) return;

    const markAsRead = async () => {
      try {
        console.log(`[GROUP_CHAT] Marking messages as read for user ${userRoll} in group ${userGroup.id}`);
        
        // Clear unread count
        const unreadRef = ref(db, `groupUnreadCounts/${userGroup.id}/${userRoll}`);
        await set(unreadRef, 0);
        console.log(`[GROUP_CHAT] Cleared unread count in Firebase`);

        // Mark recent messages as read
        const readStatusRef = ref(db, `groupMessageReadStatus/${userGroup.id}`);
        const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
        
        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};
        
        const readUpdates = {};
        Object.keys(messages).forEach(messageId => {
          readUpdates[`${messageId}/${userRoll}`] = {
            readAt: serverTimestamp(),
            readBy: userRoll
          };
        });

        if (Object.keys(readUpdates).length > 0) {
          await safeUpdate(readStatusRef, readUpdates);
          console.log(`[GROUP_CHAT] Marked ${Object.keys(readUpdates).length} messages as read`);
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    const timer = setTimeout(markAsRead, 500);
    return () => clearTimeout(timer);
  }, [userGroup, userRoll]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!userGroup || !userRoll) return;

    const typingRef = ref(db, `groupTyping/${userGroup.id}/${userRoll}`);
    
    set(typingRef, {
      isTyping: true,
      timestamp: serverTimestamp(),
      userName: userName || "Unknown"
    }).catch(console.error);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const newTimeout = setTimeout(() => {
      set(typingRef, null).catch(console.error);
    }, 3000);

    setTypingTimeout(newTimeout);
  };

  // Clear typing status
  const clearTyping = () => {
    if (!userGroup || !userRoll) return;

    const typingRef = ref(db, `groupTyping/${userGroup.id}/${userRoll}`);
    set(typingRef, null).catch(console.error);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // Get typing users
  const getTypingUsers = () => {
    if (!userGroup || !typingStates) return [];

    return Object.entries(typingStates)
      .filter(([roll, data]) => 
        roll !== userRoll && 
        data?.isTyping && 
        Date.now() - new Date(data.timestamp).getTime() < 5000
      )
      .map(([roll, data]) => ({
        roll,
        userName: data.userName || userGroup.participantNames[roll] || roll
      }));
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyToMessage({
      id: message.id,
      text: message.text,
      senderName: message.senderName,
      senderRoll: message.senderRoll,
    });
    
    // Focus the input field after setting reply
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Touch handlers for swipe to reply
  const handleTouchStart = (e, message) => {
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      currentX: touch.clientX,
      messageId: message.id,
      swiping: false
    });
  };

  const handleTouchMove = (e, message) => {
    if (swipeState.messageId !== message.id) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    
    if (deltaX > 0 && deltaX <= 100) {
      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        swiping: Math.abs(deltaX) > 10
      }));
    }
  };

  const handleTouchEnd = (e, message) => {
    if (swipeState.messageId !== message.id) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    
    if (deltaX > 50) {
      handleReplyToMessage(message);
    }
    
    setSwipeState({ startX: 0, currentX: 0, messageId: null, swiping: false });
  };

  const getSwipeOffset = (messageId) => {
    if (swipeState.messageId !== messageId || !swipeState.swiping) return 0;
    const deltaX = swipeState.currentX - swipeState.startX;
    return Math.min(Math.max(deltaX, 0), 100);
  };

  // Long press handlers for mobile emoji reactions
  const handleLongPressStart = (e, message) => {
    // Clear any existing timer
    if (longPressState.timer) {
      clearTimeout(longPressState.timer);
    }

    const timer = setTimeout(() => {
      // Show emoji panel for this message
      setLongPressState(prev => ({
        ...prev,
        isLongPressing: true,
        activeMessagePanel: message.id
      }));
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press duration

    setLongPressState(prev => ({
      ...prev,
      timer,
      messageId: message.id,
      isLongPressing: false,
      activeMessagePanel: null
    }));
  };

  const handleLongPressEnd = (e, message) => {
    // Clear the timer
    if (longPressState.timer) {
      clearTimeout(longPressState.timer);
    }

    // If we weren't long pressing, reset state
    if (!longPressState.isLongPressing) {
      setLongPressState(prev => ({
        ...prev,
        timer: null,
        messageId: null,
        isLongPressing: false,
        activeMessagePanel: null
      }));
    }
  };

  const handleLongPressCancel = (e, message) => {
    // Clear the timer and reset state
    if (longPressState.timer) {
      clearTimeout(longPressState.timer);
    }

    setLongPressState(prev => ({
      ...prev,
      timer: null,
      messageId: null,
      isLongPressing: false,
      activeMessagePanel: null
    }));
  };

  // Handle emoji panel state for specific message
  const handleEmojiPanelChange = (messageId, isOpen) => {
    if (isOpen) {
      setLongPressState(prev => ({
        ...prev,
        activeMessagePanel: messageId
      }));
    } else {
      setLongPressState(prev => ({
        ...prev,
        activeMessagePanel: null,
        isLongPressing: false
      }));
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    const input = messageInputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = newMessage;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setNewMessage(newText);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.focus();
      }, 0);
    } else {
      setNewMessage(prev => prev + emoji);
    }
    
    // Close emoji panel
    setShowEmojiPanel(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userGroup) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    clearTyping();
    setShowMentionDropdown(false);
    setMentionSearchText("");
    setFilteredMentions([]);

    try {
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      
      // Extract mentions from message
      const mentionedUsers = [];
      let isEveryoneMentioned = false;
      
      // Check for @everyone
      if (messageText.includes('@everyone')) {
        isEveryoneMentioned = true;
        // Add all group members except sender
        userGroup.participants.forEach(roll => {
          if (roll !== userRoll) {
            mentionedUsers.push(roll);
          }
        });
      }
      
      // Check for individual user mentions
      userGroup.participants.forEach(roll => {
        if (roll !== userRoll) {
          const name = userGroup.participantNames[roll];
          if (name) {
            const displayName = toProperCase(name);
            const mentionRegex = new RegExp(`@${displayName}\\b`, 'gi');
            if (mentionRegex.test(messageText) && !mentionedUsers.includes(roll)) {
              mentionedUsers.push(roll);
            }
          }
        }
      });
      
      const messageData = {
        text: messageText,
        senderRoll: userRoll,
        senderName: userName || "Unknown",
        timestamp: serverTimestamp(),
      };

      // Add mention data if there are mentions
      if (mentionedUsers.length > 0) {
        messageData.mentions = {
          users: mentionedUsers,
          isEveryone: isEveryoneMentioned
        };
      }

      if (replyToMessage) {
        messageData.replyTo = {
          messageId: replyToMessage.id,
          text: replyToMessage.text,
          senderName: replyToMessage.senderName,
          senderRoll: replyToMessage.senderRoll,
        };
      }

      const newMessageRef = await push(messagesRef, messageData);
      setReplyToMessage(null);

      // Update unread counts for all other group members (higher count for mentioned users)
      console.log(`[GROUP_CHAT] Updating unread counts for ${userGroup.participants.length - 1} other members`);
      for (const participantRoll of userGroup.participants) {
        if (participantRoll !== userRoll) {
          const unreadRef = ref(db, `groupUnreadCounts/${userGroup.id}/${participantRoll}`);
          const currentSnapshot = await get(unreadRef);
          const currentCount = currentSnapshot.val() || 0;
          
          // Give mentioned users extra notification weight
          const increment = mentionedUsers.includes(participantRoll) ? 2 : 1;
          const newCount = currentCount + increment;
          await set(unreadRef, newCount);
          console.log(`[GROUP_CHAT] Updated unread count for ${participantRoll}: ${currentCount} -> ${newCount} (mentioned: ${mentionedUsers.includes(participantRoll)})`);
        }
      }

      // Mark as read by sender
      const readStatusRef = ref(db, `groupMessageReadStatus/${userGroup.id}/${newMessageRef.key}/${userRoll}`);
      await set(readStatusRef, {
        readAt: serverTimestamp(),
        readBy: userRoll
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageText);
    }
  };

  // Load older messages
  const loadOlderMessages = async () => {
    if (!userGroup || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      const snapshot = await get(messagesRef);
      const data = snapshot.val() || {};
      const allMessages = Object.entries(data).map(([id, message]) => ({
        id,
        ...message,
      }));
      setMessages(allMessages);
      setShowOlderMessages(false);
    } catch (error) {
      console.error("Error loading older messages:", error);
      toast.error("Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
  };

  // Get relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return messageTime.toLocaleDateString();
  };

  // Get online count
  const getOnlineCount = () => {
    return Object.values(activeUsers).filter(user => user.online).length + 1; // +1 for current user
  };

  // Poll functions
  const createPoll = async (pollData) => {
    if (!userGroup) return;

    try {
      const pollsRef = ref(db, `groupPolls/${userGroup.id}`);
      const newPollRef = await push(pollsRef, pollData);
      
      // Send a message about the poll creation
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      await push(messagesRef, {
        text: `📊 ${AuthUtils.getUserName()} created a new poll: "${pollData.question}"`,
        senderRoll: "system",
        senderName: "System",
        timestamp: serverTimestamp(),
        type: "poll_notification",
        pollId: newPollRef.key
      });

      toast.success("Poll created successfully!");
    } catch (error) {
      console.error("Error creating poll:", error);
      throw error;
    }
  };

  const votePoll = async (pollId, optionIndexes) => {
    if (!userGroup || !AuthUtils.isAuthenticated()) return;

    try {
      const pollRef = ref(db, `groupPolls/${userGroup.id}/${pollId}`);
      const pollSnapshot = await get(pollRef);
      const poll = pollSnapshot.val();

      if (!poll || !poll.isActive) {
        toast.error("This poll is no longer active");
        return;
      }

      // Remove user's previous votes
      const updatedOptions = poll.options.map(option => ({
        ...option,
        votes: option.voters && option.voters[userRoll] 
          ? Math.max(0, option.votes - 1) 
          : option.votes,
        voters: {
          ...option.voters,
          [userRoll]: null
        }
      }));

      // Add new votes
      let totalVotes = 0;
      optionIndexes.forEach(index => {
        if (updatedOptions[index]) {
          updatedOptions[index].votes = (updatedOptions[index].votes || 0) + 1;
          updatedOptions[index].voters = {
            ...updatedOptions[index].voters,
            [userRoll]: {
              votedAt: Date.now(),
              voterRoll: userRoll,
              voterName: AuthUtils.getUserName()
            }
          };
        }
      });

      // Calculate total votes
      updatedOptions.forEach(option => {
        totalVotes += option.votes || 0;
      });

      await update(pollRef, {
        options: updatedOptions,
        totalVotes
      });

    } catch (error) {
      console.error("Error voting on poll:", error);
      throw error;
    }
  };

  const closePoll = async (pollId) => {
    if (!userGroup || !AuthUtils.isAuthenticated()) return;

    try {
      const pollRef = ref(db, `groupPolls/${userGroup.id}/${pollId}`);
      await update(pollRef, {
        isActive: false,
        closedAt: Date.now(),
        closedBy: AuthUtils.getUserRoll()
      });

      // Send a message about poll closure
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      await push(messagesRef, {
        text: `📊 ${AuthUtils.getUserName()} closed the poll`,
        senderRoll: "system", 
        senderName: "System",
        timestamp: serverTimestamp(),
        type: "poll_notification",
        pollId
      });

      toast.success("Poll closed successfully!");
    } catch (error) {
      console.error("Error closing poll:", error);
      toast.error("Failed to close poll");
    }
  };

  const editPoll = async (pollId, updatedPollData) => {
    if (!userGroup || !AuthUtils.isAuthenticated()) return;

    try {
      const pollRef = ref(db, `groupPolls/${userGroup.id}/${pollId}`);
      const pollSnapshot = await get(pollRef);
      const currentPoll = pollSnapshot.val();

      if (!currentPoll) {
        throw new Error("Poll not found");
      }

      if (currentPoll.createdBy !== AuthUtils.getUserRoll()) {
        throw new Error("Only the poll creator can edit this poll");
      }

      if (!currentPoll.isActive) {
        throw new Error("Cannot edit a closed poll");
      }

      // Preserve existing votes when updating options
      const updatedOptions = updatedPollData.options.map((newOption, index) => {
        // Try to find a matching option from the current poll
        const existingOption = currentPoll.options.find(opt => opt.text === newOption.text);
        return {
          text: newOption.text,
          votes: existingOption ? existingOption.votes : 0,
          voters: existingOption ? existingOption.voters : {}
        };
      });

      // Recalculate total votes
      const totalVotes = updatedOptions.reduce((sum, option) => sum + (option.votes || 0), 0);

      await update(pollRef, {
        question: updatedPollData.question,
        options: updatedOptions,
        allowMultiple: updatedPollData.allowMultiple,
        isAnonymous: updatedPollData.isAnonymous,
        totalVotes,
        editedAt: Date.now(),
        editedBy: AuthUtils.getUserRoll()
      });

      // Send a message about poll edit
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      await push(messagesRef, {
        text: `📝 ${AuthUtils.getUserName()} updated the poll`,
        senderRoll: "system", 
        senderName: "System",
        timestamp: serverTimestamp(),
        type: "poll_notification",
        pollId
      });

    } catch (error) {
      console.error("Error editing poll:", error);
      throw error;
    }
  };

  // Get users who have seen a specific message
  const getMessageSeenBy = (messageId) => {
    if (!messageReadStatus[messageId] || !userGroup) return [];
    
    const seenBy = [];
    const messageReads = messageReadStatus[messageId];
    
    userGroup.participants.forEach(roll => {
      if (messageReads[roll] && roll !== userRoll) { // Exclude current user
        const memberName = userGroup.participantNames[roll];
        seenBy.push({
          roll,
          name: toProperCase(memberName) || roll,
          readAt: messageReads[roll].readAt
        });
      }
    });
    
    // Sort by read time (most recent first)
    return seenBy.sort((a, b) => new Date(b.readAt) - new Date(a.readAt));
  };

  if (!isOpen || !userGroup) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col">
      <style jsx>{`
        .group-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .group-scrollbar::-webkit-scrollbar-track {
          background: rgb(243 244 246);
          border-radius: 8px;
        }
        
        .group-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(156 163 175);
          border-radius: 8px;
          border: 2px solid rgb(243 244 246);
        }
        
        .group-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128);
        }
        
        .dark .group-scrollbar::-webkit-scrollbar-track {
          background: rgb(31 41 55);
        }
        
        .dark .group-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(75 85 99);
          border: 2px solid rgb(31 41 55);
        }
        
        .dark .group-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128);
        }
        
        .group-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(156 163 175) rgb(243 244 246);
        }
        
        .dark .group-scrollbar {
          scrollbar-color: rgb(75 85 99) rgb(31 41 55);
        }

        /* Mention Styles */
        .mention {
          display: inline;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-decoration: none;
          cursor: default;
        }
        
        .mention.everyone {
          background: rgba(147, 51, 234, 0.2);
          color: rgb(147, 51, 234);
          border: 1px solid rgba(147, 51, 234, 0.3);
        }
        
        .mention.user {
          background: rgba(59, 130, 246, 0.2);
          color: rgb(59, 130, 246);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* Dark mode mention styles */
        .dark .mention.everyone {
          background: rgba(168, 85, 247, 0.3);
          color: rgb(196, 181, 253);
          border: 1px solid rgba(168, 85, 247, 0.4);
        }
        
        .dark .mention.user {
          background: rgba(96, 165, 250, 0.3);
          color: rgb(147, 197, 253);
          border: 1px solid rgba(96, 165, 250, 0.4);
        }
        
        /* Mention styles inside own messages */
        .bg-indigo-600 .mention.everyone {
          background: rgba(168, 85, 247, 0.4);
          color: rgb(221, 214, 254);
          border: 1px solid rgba(168, 85, 247, 0.5);
        }
        
        .bg-indigo-600 .mention.user {
          background: rgba(147, 197, 253, 0.4);
          color: rgb(219, 234, 254);
          border: 1px solid rgba(147, 197, 253, 0.5);
        }
      `}</style>
      
      <div className="w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-sm relative">
              <i className="fas fa-users text-white"></i>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {userGroup.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {userGroup.participants.length} members • {getOnlineCount()} online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPollHistory(!showPollHistory)}
              className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Poll History"
            >
              <i className="fas fa-history text-gray-500 text-sm sm:text-base md:text-lg"></i>
            </button>
            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Group Members"
            >
              <i className="fas fa-users text-gray-500 text-sm sm:text-base md:text-lg"></i>
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-gray-500 text-sm sm:text-base md:text-lg"></i>
            </button>
          </div>
        </div>

        {/* Member List */}
        {showMemberList && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Group Members ({userGroup.participants.length})
                </h3>
                <button
                  onClick={() => setShowMemberList(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close member list"
                >
                  <i className="fas fa-times text-gray-500 dark:text-gray-400 text-sm"></i>
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userGroup.participants
                  .sort((a, b) => {
                    const aIsOnline = activeUsers[a]?.online || a === userRoll;
                    const bIsOnline = activeUsers[b]?.online || b === userRoll;
                    const aLastSeen = activeUsers[a]?.lastSeen;
                    const bLastSeen = activeUsers[b]?.lastSeen;
                    
                    // Priority: 1. Active users, 2. Users with last seen, 3. Offline users
                    if (aIsOnline && !bIsOnline) return -1;
                    if (!aIsOnline && bIsOnline) return 1;
                    if (aIsOnline && bIsOnline) {
                      // Both online: current user first
                      if (a === userRoll) return -1;
                      if (b === userRoll) return 1;
                      return 0;
                    }
                    
                    // Both offline: prioritize those with last seen time
                    const aHasLastSeen = !!aLastSeen;
                    const bHasLastSeen = !!bLastSeen;
                    
                    if (aHasLastSeen && !bHasLastSeen) return -1;
                    if (!aHasLastSeen && bHasLastSeen) return 1;
                    if (aHasLastSeen && bHasLastSeen) {
                      // Both have last seen: sort by most recent
                      return new Date(bLastSeen) - new Date(aLastSeen);
                    }
                    
                    return 0; // Both completely offline
                  })
                  .map((roll) => {
                  const memberName = userGroup.participantNames[roll];
                  const isOnline = activeUsers[roll]?.online || false;
                  const lastSeen = activeUsers[roll]?.lastSeen;
                  const isCurrentUser = roll === userRoll;
                  
                  // Determine status text and color
                  let statusText = "Offline";
                  let statusColor = "text-gray-400";
                  
                  if (isCurrentUser) {
                    statusText = "Online (You)";
                    statusColor = "text-green-600 dark:text-green-400";
                  } else if (isOnline) {
                    statusText = "Active";
                    statusColor = "text-green-600 dark:text-green-400";
                  } else if (lastSeen) {
                    const timeAgo = getRelativeTime(lastSeen);
                    statusText = `Last seen ${timeAgo} ago`;
                    statusColor = "text-amber-600 dark:text-amber-400";
                  }
                  
                  return (
                    <div
                      key={roll}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {toProperCase(memberName)?.charAt(0) || roll?.charAt(0)}
                        </div>
                        {(isOnline || isCurrentUser) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {toProperCase(memberName) || roll}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Roll: {roll}
                          <span className={`ml-2 ${statusColor}`}>
                            • {statusText}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Poll History */}
        {showPollHistory && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Poll History ({polls.filter(poll => !poll.isActive).length})
                </h3>
                <button
                  onClick={() => setShowPollHistory(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close poll history"
                >
                  <i className="fas fa-times text-gray-500 dark:text-gray-400 text-sm"></i>
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {polls.filter(poll => !poll.isActive).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-poll text-2xl mb-2 opacity-50"></i>
                    <p className="text-sm">No poll history yet</p>
                  </div>
                ) : (
                  polls
                    .filter(poll => !poll.isActive)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((poll) => (
                      <PollDisplay
                        key={poll.id}
                        poll={poll}
                        onVote={votePoll}
                        onClosePoll={closePoll}
                        onEditPoll={editPoll}
                        currentUserRoll={userRoll}
                        isHistoryView={true}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 min-h-0 group-scrollbar">
          {showOlderMessages && (
            <div className="text-center">
              <button
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                {loadingOlder ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-chevron-up mr-2"></i>
                )}
                See older messages
              </button>
            </div>
          )}

          {messages.map((message) => {
            const isOwnMessage = message.senderRoll === userRoll;
            const swipeOffset = getSwipeOffset(message.id);
            const senderName = toProperCase(userGroup.participantNames[message.senderRoll]) || message.senderName;
            
            // Check if current user is mentioned in this message
            const isMentioned = message.mentions && (
              message.mentions.users.includes(userRoll) || 
              message.mentions.isEveryone
            );
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group relative`}
              >
                {/* Reply icon during swipe */}
                {swipeOffset > 10 && (
                  <div 
                    className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 transition-opacity duration-150 sm:hidden`}
                    style={{ opacity: Math.min(swipeOffset / 50, 1) }}
                  >
                    <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.354 1.646a.5.5 0 0 1 0 .708L5.707 5H14.5a.5.5 0 0 1 0 1H5.707l2.647 2.646a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] px-3 sm:px-4 py-2 sm:py-3 rounded-lg relative transition-transform duration-150 ${
                    isOwnMessage
                      ? "bg-indigo-600 text-white"
                      : isMentioned
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-gray-900 dark:text-gray-100 border-2 border-yellow-300 dark:border-yellow-600"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                  style={{
                    transform: `translateX(${swipeOffset}px)`,
                    touchAction: 'pan-y'
                  }}
                  onTouchStart={(e) => {
                    // Don't handle if touch is on emoji panel
                    if (e.target.closest('[data-emoji-panel="true"]')) {
                      return;
                    }
                    handleTouchStart(e, message);
                    handleLongPressStart(e, message);
                  }}
                  onTouchMove={(e) => {
                    // Don't handle if touch is on emoji panel
                    if (e.target.closest('[data-emoji-panel="true"]')) {
                      return;
                    }
                    handleTouchMove(e, message);
                    // Cancel long press on move
                    if (longPressState.timer) {
                      clearTimeout(longPressState.timer);
                      setLongPressState(prev => ({ ...prev, timer: null }));
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Don't handle if touch is on emoji panel
                    if (e.target.closest('[data-emoji-panel="true"]')) {
                      return;
                    }
                    handleTouchEnd(e, message);
                    handleLongPressEnd(e, message);
                  }}
                  onTouchCancel={(e) => {
                    // Don't handle if touch is on emoji panel
                    if (e.target.closest('[data-emoji-panel="true"]')) {
                      return;
                    }
                    handleLongPressCancel(e, message);
                  }}
                >
                  {/* Mention indicator */}
                  {!isOwnMessage && isMentioned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">@</span>
                    </div>
                  )}

                  {/* Reply button (desktop) */}
                  <button
                    onClick={() => handleReplyToMessage(message)}
                    className={`absolute -top-2 ${isOwnMessage ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 text-xs hidden sm:block`}
                    title="Reply"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.354 1.646a.5.5 0 0 1 0 .708L5.707 5H14.5a.5.5 0 0 1 0 1H5.707l2.647 2.646a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </button>

                  {/* Sender name for group chat */}
                  <p className={`text-xs font-medium mb-1 ${
                    isOwnMessage 
                      ? "text-indigo-200" 
                      : isMentioned
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-indigo-600 dark:text-indigo-400"
                  }`}>
                    {isOwnMessage ? "You" : senderName}
                  </p>

                  {/* Reply context */}
                  {message.replyTo && (
                    <div className={`mb-2 p-2 rounded border-l-4 ${
                      isOwnMessage 
                        ? "bg-indigo-700/50 border-indigo-300" 
                        : "bg-gray-300 dark:bg-gray-600 border-gray-500"
                    }`}>
                      <p className={`text-xs font-medium ${
                        isOwnMessage ? "text-indigo-200" : "text-gray-600 dark:text-gray-300"
                      }`}>
                        {message.replyTo.senderRoll === userRoll ? "You" : toProperCase(message.replyTo.senderName)}
                      </p>
                      <p className={`text-xs mt-1 truncate ${
                        isOwnMessage ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {message.replyTo.text}
                      </p>
                    </div>
                  )}

                  {/* Message text with mentions */}
                  <div 
                    className="text-sm sm:text-base break-words"
                    dangerouslySetInnerHTML={{
                      __html: parseMentions(message.text)
                    }}
                    style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  />
                  
                  {/* Link previews and embeds */}
                  {(() => {
                    const detectedLinks = detectLinks(message.text);
                    if (detectedLinks.length === 0) return null;
                    
                    return detectedLinks.map((link, index) => {
                      // Render YouTube embed
                      if (link.platform === SUPPORTED_PLATFORMS.YOUTUBE && link.videoId) {
                        return (
                          <YouTubeEmbed 
                            key={`youtube-${index}`}
                            videoId={link.videoId} 
                            isOwnMessage={isOwnMessage}
                          />
                        );
                      }
                      
                      // Render link preview for other supported platforms
                      return (
                        <LinkPreview 
                          key={`link-${index}`}
                          link={link} 
                          isOwnMessage={isOwnMessage}
                        />
                      );
                    });
                  })()}
                  
                  {/* Seen by display (Facebook-style) - inside message bubble */}
                  {isOwnMessage && (() => {
                    const seenBy = getMessageSeenBy(message.id);
                    if (seenBy.length === 0) return null;
                    
                    return (
                      <div className="flex items-center gap-1 mt-1 mb-1">
                        {/* Show up to 3 profile initials */}
                        <div className="flex -space-x-1">
                          {seenBy.slice(0, 3).map((user, index) => (
                            <div
                              key={user.roll}
                              className="w-3 h-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[7px] font-bold border border-white dark:border-indigo-600"
                              style={{ zIndex: 3 - index }}
                              title={`Seen by ${user.name}`}
                            >
                              {user.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                        
                        {/* Seen by text */}
                        <span className={`text-[9px] ml-1 ${
                          isOwnMessage 
                            ? "text-indigo-200" 
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {seenBy.length === 1 
                            ? `Seen by ${seenBy[0].name}`
                            : seenBy.length <= 3
                              ? `Seen by ${seenBy.map(u => u.name).join(', ')}`
                              : `Seen by ${seenBy.slice(0, 2).map(u => u.name).join(', ')} and ${seenBy.length - 2} others`
                          }
                        </span>
                      </div>
                    );
                  })()}

                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? "text-indigo-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {getRelativeTime(message.timestamp)}
                  </p>

                  {/* Message Reactions - Real-time updates */}
                  <MessageReactions
                    messageId={message.id}
                    chatPath={`groupMessages/${userGroup.id}`}
                    currentUserRoll={userRoll}
                    isOwnMessage={isOwnMessage}
                    className=""
                    showEmojiPanel={longPressState.activeMessagePanel === message.id}
                    onShowEmojiPanelChange={(isOpen) => handleEmojiPanelChange(message.id, isOpen)}
                  />
                </div>
              </div>
            );
          })}

          {/* Active Polls */}
          {polls.filter(poll => poll.isActive).map((poll) => (
            <PollDisplay
              key={poll.id}
              poll={poll}
              onVote={votePoll}
              onClosePoll={closePoll}
              onEditPoll={editPoll}
              currentUserRoll={userRoll}
            />
          ))}

          {/* Typing indicator */}
          {getTypingUsers().length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg max-w-[75%] sm:max-w-[65%]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {getTypingUsers().length === 1 
                      ? `${getTypingUsers()[0].userName} is typing...`
                      : `${getTypingUsers().length} people are typing...`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          {/* Reply preview */}
          {replyToMessage && (
            <div className="px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Replying to {replyToMessage.senderRoll === userRoll ? "yourself" : toProperCase(replyToMessage.senderName)}
                  </p>
                  <button
                    onClick={cancelReply}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyToMessage.text}
                </p>
              </div>
            </div>
          )}
          
          <div className="p-3 sm:p-4 md:p-5">
            <div className="relative">
              {/* Mention Dropdown */}
              {showMentionDropdown && filteredMentions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Mention someone...
                    </p>
                  </div>
                  <div className="py-1">
                    {filteredMentions.map((mention, index) => (
                      <button
                        key={mention.id}
                        onClick={() => insertMention(mention)}
                        onMouseEnter={() => setSelectedMentionIndex(index)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                          index === selectedMentionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        {mention.isEveryone ? (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            @
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {mention.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {mention.isEveryone ? 'Everyone' : mention.displayName}
                          </p>
                          {!mention.isEveryone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              Roll: {mention.roll}
                            </p>
                          )}
                        </div>
                        {mention.isEveryone && (
                          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            All members
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder="Type a message... (Use @ to mention users)"
                    value={newMessage}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      const cursorPos = e.target.selectionStart;
                      setNewMessage(newValue);
                      
                      // Handle mention detection
                      handleMentionInput(newValue, cursorPos);
                      
                      if (newValue.trim()) {
                        handleTyping();
                      } else {
                        clearTyping();
                      }
                    }}
                    onKeyDown={handleMentionKeyDown}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !showMentionDropdown) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onBlur={(e) => {
                      // Delay hiding dropdown to allow for clicks
                      setTimeout(() => {
                        setShowMentionDropdown(false);
                        clearTyping();
                      }, 150);
                    }}
                    onFocus={() => {
                      const cursorPos = messageInputRef.current?.selectionStart || 0;
                      handleMentionInput(newMessage, cursorPos);
                    }}
                    onClick={(e) => {
                      const cursorPos = e.target.selectionStart;
                      handleMentionInput(newMessage, cursorPos);
                    }}
                    className="w-full pr-10 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Add emoji"
                  >
                    <span className="text-lg">😀</span>
                  </button>
                  <EmojiPanel
                    isOpen={showEmojiPanel}
                    onClose={() => setShowEmojiPanel(false)}
                    onEmojiSelect={handleEmojiSelect}
                    inputRef={messageInputRef}
                  />
                </div>
                <button
                  onClick={() => setShowPollModal(true)}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0"
                  title="Create Poll"
                >
                  <i className="fas fa-poll text-sm sm:text-base"></i>
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 sm:px-5 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <i className="fas fa-paper-plane text-sm sm:text-base"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Poll Creation Modal */}
      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={createPoll}
        groupId={userGroup?.id}
      />
    </div>
  );
};

export default GroupChat;
