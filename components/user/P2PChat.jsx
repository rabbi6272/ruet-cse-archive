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
import { users } from "@/lib/mino";
import EmojiPanel from "@/components/ui/EmojiPanel";
import MessageReactions from "@/components/ui/MessageReactions";

// Link detection and preview utilities
const SUPPORTED_PLATFORMS = {
  YOUTUBE: "youtube",
  CODEFORCES: "codeforces",
  ATCODER: "atcoder",
  LEETCODE: "leetcode",
  GITHUB: "github",
  LINKEDIN: "linkedin",
  GOOGLE: "google",
  FACEBOOK: "facebook",
};

// URL patterns for different platforms
const URL_PATTERNS = {
  [SUPPORTED_PLATFORMS.YOUTUBE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
  ],
  [SUPPORTED_PLATFORMS.CODEFORCES]: [
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/(problemset\/problem|contest|gym)\/[\w\/-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/blog\/entry\/[\d]+/i,
  ],
  [SUPPORTED_PLATFORMS.ATCODER]: [
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+\/tasks\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/users\/[\w-]+/i,
  ],
  [SUPPORTED_PLATFORMS.LEETCODE]: [
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/discuss\/[\w\/-]+/i,
  ],
  [SUPPORTED_PLATFORMS.GITHUB]: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+(?:\/.*)?/i,
  ],
  [SUPPORTED_PLATFORMS.LINKEDIN]: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/[\w:-]+/i,
  ],
  [SUPPORTED_PLATFORMS.GOOGLE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:docs|drive|forms|sheets|slides)\.google\.com\/[\w\/\-\?=&]+/i,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/[\w\/\-\?=&]+/i,
  ],
  [SUPPORTED_PLATFORMS.FACEBOOK]: [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/[\w.-]+/i,
    /(?:https?:\/\/)?(?:www\.)?m\.facebook\.com\/[\w.-]+/i,
  ],
};

// Function to detect and parse links in text
const detectLinks = (text) => {
  const links = [];
  const foundUrls = new Set(); // To avoid duplicates

  // Check each platform's patterns
  Object.entries(URL_PATTERNS).forEach(([platform, patterns]) => {
    patterns.forEach((pattern) => {
      // Use global flag to find all matches
      const globalPattern = new RegExp(pattern.source, "gi");
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
            videoId: videoId,
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
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
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
    [SUPPORTED_PLATFORMS.YOUTUBE]: "🎥",
    [SUPPORTED_PLATFORMS.CODEFORCES]: "💻",
    [SUPPORTED_PLATFORMS.ATCODER]: "🏆",
    [SUPPORTED_PLATFORMS.LEETCODE]: "🧩",
    [SUPPORTED_PLATFORMS.GITHUB]: "🐙",
    [SUPPORTED_PLATFORMS.LINKEDIN]: "💼",
    [SUPPORTED_PLATFORMS.GOOGLE]: "📄",
    [SUPPORTED_PLATFORMS.FACEBOOK]: "📘",
  };
  return icons[platform] || "🔗";
};

// Function to get platform name
const getPlatformName = (platform) => {
  const names = {
    [SUPPORTED_PLATFORMS.YOUTUBE]: "YouTube",
    [SUPPORTED_PLATFORMS.CODEFORCES]: "Codeforces",
    [SUPPORTED_PLATFORMS.ATCODER]: "AtCoder",
    [SUPPORTED_PLATFORMS.LEETCODE]: "LeetCode",
    [SUPPORTED_PLATFORMS.GITHUB]: "GitHub",
    [SUPPORTED_PLATFORMS.LINKEDIN]: "LinkedIn",
    [SUPPORTED_PLATFORMS.GOOGLE]: "Google",
    [SUPPORTED_PLATFORMS.FACEBOOK]: "Facebook",
  };
  return names[platform] || "Link";
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
        <div
          className={`border rounded-lg p-3 ${
            isOwnMessage
              ? "border-indigo-300 bg-indigo-700/30"
              : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎥</span>
            <span
              className={`text-sm font-medium ${
                isOwnMessage
                  ? "text-indigo-100"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              YouTube Video (Error loading)
            </span>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:underline ${
              isOwnMessage
                ? "text-indigo-200"
                : "text-blue-600 dark:text-blue-400"
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
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ paddingBottom: "56.25%" /* 16:9 aspect ratio */ }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <i className="fas fa-spinner fa-spin text-gray-500 text-lg"></i>
              <span className="text-xs sm:text-sm text-gray-500">
                Loading video...
              </span>
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
              ? "text-indigo-200 hover:text-indigo-100"
              : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          }`}
        >
          <span className="hidden xs:inline">Watch on YouTube</span>
          <span className="xs:hidden">YouTube</span>
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
          </svg>
        </a>
        <span
          className={`text-xs ${
            isOwnMessage
              ? "text-indigo-200"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
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
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, "");

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
          return `Problem: ${leetcodeMatch[1].replace(/-/g, " ")}`;
        }
        break;
      case SUPPORTED_PLATFORMS.CODEFORCES:
        if (url.includes("/problemset/problem/")) {
          const cfMatch = url.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/);
          if (cfMatch) {
            return `Problem ${cfMatch[1]}${cfMatch[2]}`;
          }
        } else if (url.includes("/contest/")) {
          const contestMatch = url.match(/\/contest\/(\d+)/);
          if (contestMatch) {
            return `Contest ${contestMatch[1]}`;
          }
        }
        break;
      case SUPPORTED_PLATFORMS.ATCODER:
        if (url.includes("/contests/")) {
          const atcoderMatch = url.match(
            /\/contests\/([\w-]+)(?:\/tasks\/([\w-]+))?/
          );
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
        if (url.includes("/in/")) {
          const linkedinMatch = url.match(/\/in\/([\w-]+)/);
          if (linkedinMatch) {
            return `Profile: ${linkedinMatch[1]}`;
          }
        } else if (url.includes("/company/")) {
          const companyMatch = url.match(/\/company\/([\w-]+)/);
          if (companyMatch) {
            return `Company: ${companyMatch[1]}`;
          }
        }
        break;
    }

    return cleanUrl.length > 50 ? cleanUrl.substring(0, 50) + "..." : cleanUrl;
  };

  const urlInfo = getUrlInfo(link.url, platform);

  return (
    <div className="mt-2 mb-2">
      <div
        className={`border rounded-lg p-3 transition-colors hover:bg-opacity-80 ${
          isOwnMessage
            ? "border-indigo-300 bg-indigo-700/30 hover:bg-indigo-700/40"
            : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{platformIcon}</span>
          <span
            className={`text-sm font-medium ${
              isOwnMessage
                ? "text-indigo-100"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {platformName}
          </span>
        </div>
        <div className="space-y-1">
          <p
            className={`text-sm font-medium ${
              isOwnMessage
                ? "text-indigo-100"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {urlInfo}
          </p>
          <a
            href={
              link.url.startsWith("http") ? link.url : `https://${link.url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs break-all hover:underline inline-flex items-center gap-1 ${
              isOwnMessage
                ? "text-indigo-200 hover:text-indigo-100"
                : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            }`}
          >
            Open link
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

const P2PChat = ({ userRoll, userName, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("chats");
  const [chatRequests, setChatRequests] = useState([]);
  const [approvedChats, setApprovedChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [requestRoll, setRequestRoll] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});
  const [typingStates, setTypingStates] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageReadStatus, setMessageReadStatus] = useState({});
  const [replyToMessage, setReplyToMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [swipeState, setSwipeState] = useState({
    startX: 0,
    currentX: 0,
    messageId: null,
    swiping: false,
  });
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  // Long press and emoji panel state for mobile
  const [longPressState, setLongPressState] = useState({ 
    timer: null, 
    messageId: null, 
    isLongPressing: false,
    activeMessagePanel: null // Track which message has active emoji panel
  });

  // Convert name to proper case (first letter of each word capitalized)
  const toProperCase = (name) => {
    if (!name || typeof name !== "string") return name;
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Safe update wrapper to prevent null/undefined values
  const safeUpdate = async (dbRef, updateData) => {
    try {
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        console.warn("Invalid update data:", updateData);
        return;
      }

      // Filter out null/undefined values
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(
          ([key, value]) => value !== null && value !== undefined
        )
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
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Track the last message to only scroll on new messages, not reactions
  const lastMessageRef = useRef(null);
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Initial scroll when chat opens - use instant scroll to avoid animation
      if (!hasInitialScrolled.current) {
        scrollToBottom("auto"); // Use "auto" for instant positioning
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
  }, [messages, selectedChat]);

  // Reset scroll tracking when chat changes
  useEffect(() => {
    hasInitialScrolled.current = false;
    lastMessageRef.current = null;
  }, [selectedChat]);

  // Track user presence
  useEffect(() => {
    if (!userRoll || !isOpen) return;

    // Set user as online
    const userPresenceRef = ref(db, `userPresence/${userRoll}`);
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp(),
      name: userName || "Unknown",
    };

    set(userPresenceRef, presenceData).catch(console.error);

    // Listen for presence changes of all users
    const presenceRef = ref(db, "userPresence");
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

    // Set user offline on component unmount or when chat closes
    const handleOffline = () => {
      set(userPresenceRef, {
        online: false,
        lastSeen: serverTimestamp(),
        name: userName || "Unknown",
      }).catch(console.error);

      // Clear active chat when going offline
      set(ref(db, `activeChats/${userRoll}`), null).catch(console.error);
    };

    // Cleanup function
    return () => {
      handleOffline();
      unsubscribePresence();
      // Clear active chat when component unmounts
      if (userRoll) {
        set(ref(db, `activeChats/${userRoll}`), null).catch(console.error);
      }
    };
  }, [userRoll, userName, isOpen]);

  // Load chat requests and approved chats
  useEffect(() => {
    if (!userRoll) return;

    // Load incoming chat requests
    const requestsRef = ref(db, "p2pChatRequests");
    const incomingRequestsQuery = query(
      requestsRef,
      orderByChild("toRoll"),
      equalTo(userRoll)
    );

    const unsubscribeRequests = onValue(incomingRequestsQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const requests = Object.entries(data)
        .map(([id, request]) => ({ id, ...request }))
        .filter((req) => req.status === "pending");
      setChatRequests(requests);
    });

    // Load approved chats
    const chatsRef = ref(db, "p2pChats");
    const userChatsQuery = query(
      chatsRef,
      orderByChild("status"),
      equalTo("approved")
    );

    const unsubscribeChats = onValue(userChatsQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const chats = Object.entries(data)
        .map(([id, chat]) => ({ id, ...chat }))
        .filter(
          (chat) =>
            chat.participants.includes(userRoll) && chat.status === "approved"
        )
        .sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

      // Check for and merge duplicate chats automatically
      const userPairs = new Set();
      const duplicates = [];

      chats.forEach((chat) => {
        const otherUser = chat.participants.find((p) => p !== userRoll);
        const pairKey = [userRoll, otherUser].sort().join("-");

        if (userPairs.has(pairKey)) {
          duplicates.push({ userRoll1: userRoll, userRoll2: otherUser });
        } else {
          userPairs.add(pairKey);
        }
      });

      // Merge duplicates found
      if (duplicates.length > 0) {
        duplicates.forEach(async ({ userRoll1, userRoll2 }) => {
          await mergeDuplicateChats(userRoll1, userRoll2);
        });
      }

      setApprovedChats(chats);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeChats();
    };
  }, [userRoll]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const messagesRef = ref(db, `p2pMessages/${selectedChat.id}`);
    const messagesQuery = query(messagesRef, orderByKey(), limitToLast(10));

    const unsubscribeMessages = onValue(messagesQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const messagesList = Object.entries(data).map(([id, message]) => ({
        id,
        ...message,
      }));
      setMessages(messagesList);

      // Check if there are more messages
      if (Object.keys(data).length >= 10) {
        setShowOlderMessages(true);
      } else {
        setShowOlderMessages(false);
      }
    });

    return () => unsubscribeMessages();
  }, [selectedChat]);

  // Track typing status for selected chat
  useEffect(() => {
    if (!selectedChat || !userRoll) return;

    const typingRef = ref(db, `typing/${selectedChat.id}`);

    // Listen for typing changes in this chat
    const unsubscribeTyping = onValue(
      typingRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setTypingStates(data);
      },
      (error) => {
        console.error("Error listening to typing status:", error);
      }
    );

    // Clean up typing status when leaving chat
    return () => {
      unsubscribeTyping();
      // Clear user's typing status when leaving chat
      if (selectedChat?.id && userRoll) {
        set(ref(db, `typing/${selectedChat.id}/${userRoll}`), null).catch(
          console.error
        );
      }
    };
  }, [selectedChat, userRoll]);

  // Track unread counts for all chats
  useEffect(() => {
    if (!userRoll || !isOpen) return;

    const unreadRef = ref(db, `unreadCounts/${userRoll}`);

    const unsubscribeUnread = onValue(
      unreadRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setUnreadCounts(data);
      },
      (error) => {
        console.error("Error listening to unread counts:", error);
      }
    );

    return () => unsubscribeUnread();
  }, [userRoll, isOpen]);

  // Track message read status for selected chat
  useEffect(() => {
    if (!selectedChat || !userRoll) return;

    const readStatusRef = ref(db, `messageReadStatus/${selectedChat.id}`);

    const unsubscribeReadStatus = onValue(
      readStatusRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setMessageReadStatus(data);
      },
      (error) => {
        console.error("Error listening to message read status:", error);
      }
    );

    return () => unsubscribeReadStatus();
  }, [selectedChat, userRoll]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (!selectedChat || !userRoll) return;

    const markAsRead = async () => {
      try {
        // Set user's active chat to track what they're currently viewing
        const activeChatRef = ref(db, `activeChats/${userRoll}`);
        await set(activeChatRef, selectedChat.id);

        // Clear unread count for this chat
        const unreadRef = ref(
          db,
          `unreadCounts/${userRoll}/${selectedChat.id}`
        );
        await set(unreadRef, null);

        // Mark all messages in this chat as read by this user
        const readStatusRef = ref(db, `messageReadStatus/${selectedChat.id}`);
        const messagesRef = ref(db, `p2pMessages/${selectedChat.id}`);

        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};

        const readUpdates = {};
        Object.keys(messages).forEach((messageId) => {
          readUpdates[`${messageId}/${userRoll}`] = {
            readAt: serverTimestamp(),
            readBy: userRoll,
          };
        });

        if (Object.keys(readUpdates).length > 0) {
          await safeUpdate(readStatusRef, readUpdates);
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    // Mark as read after a short delay to ensure messages are loaded
    const timer = setTimeout(markAsRead, 500);

    // Cleanup function to clear active chat when component unmounts or chat changes
    return () => {
      clearTimeout(timer);
      // Clear active chat when leaving
      if (userRoll) {
        set(ref(db, `activeChats/${userRoll}`), null).catch(console.error);
      }
    };
  }, [selectedChat, userRoll]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedChat || !userRoll) return;

    const typingRef = ref(db, `typing/${selectedChat.id}/${userRoll}`);

    // Set user as typing
    set(typingRef, {
      isTyping: true,
      timestamp: serverTimestamp(),
      userName: userName || "Unknown",
    }).catch(console.error);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to clear typing status after 3 seconds
    const newTimeout = setTimeout(() => {
      set(typingRef, null).catch(console.error);
    }, 3000);

    setTypingTimeout(newTimeout);
  };

  // Clear typing status
  const clearTyping = () => {
    if (!selectedChat || !userRoll) return;

    const typingRef = ref(db, `typing/${selectedChat.id}/${userRoll}`);
    set(typingRef, null).catch(console.error);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // Get typing users for current chat (excluding current user)
  const getTypingUsers = () => {
    if (!selectedChat || !typingStates) return [];

    return Object.entries(typingStates)
      .filter(
        ([roll, data]) =>
          roll !== userRoll &&
          data?.isTyping &&
          Date.now() - new Date(data.timestamp).getTime() < 5000 // 5 seconds timeout
      )
      .map(([roll, data]) => ({
        roll,
        userName: data.userName || roll,
      }));
  };

  // Get unread count for a specific chat
  const getUnreadCount = (chatId) => {
    // Find the chat to check if last message was sent by current user
    const chat = approvedChats.find((c) => c.id === chatId);
    if (chat && chat.lastMessageSender === userRoll) {
      // If current user sent the last message, don't show unread count
      return 0;
    }
    return unreadCounts[chatId] || 0;
  };

  // Get total unread count across all chats
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce(
      (total, count) => total + (count || 0),
      0
    );
  };

  // Get message read status for display
  const getMessageStatus = (messageId, senderRoll) => {
    if (senderRoll !== userRoll || !selectedChat) {
      // Don't show status for received messages or if no chat selected
      return null;
    }

    const readStatus = messageReadStatus[messageId];
    if (!readStatus) {
      // Message sent but no read status yet - single tick
      return "sent";
    }

    // Check if the other participant has read it
    const otherParticipant = getOtherParticipant(selectedChat);
    if (readStatus[otherParticipant.roll]) {
      // Message read by other participant - double tick
      return "read";
    }

    // Message sent but not read yet - single tick
    return "sent";
  };

  // Render message status icon
  const renderMessageStatus = (status) => {
    if (!status) return null;

    if (status === "sent") {
      return (
        <span
          className="ml-2 text-xs opacity-70 flex items-center"
          title="Sent"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </span>
      );
    }

    if (status === "read") {
      return (
        <span
          className="ml-2 text-xs opacity-70 flex items-center"
          title="Read"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          <svg
            className="w-4 h-4 -ml-2"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </span>
      );
    }

    return null;
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

  // Handle touch start for swipe detection
  const handleTouchStart = (e, message) => {
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      currentX: touch.clientX,
      messageId: message.id,
      swiping: false,
    });
  };

  // Handle touch move for swipe detection
  const handleTouchMove = (e, message) => {
    if (swipeState.messageId !== message.id) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;

    // Only allow swipe right (positive deltaX) and limit the distance
    if (deltaX > 0 && deltaX <= 100) {
      setSwipeState((prev) => ({
        ...prev,
        currentX: touch.clientX,
        swiping: Math.abs(deltaX) > 10, // Start showing swipe indicator after 10px
      }));
    }
  };

  // Handle touch end for swipe detection
  const handleTouchEnd = (e, message) => {
    if (swipeState.messageId !== message.id) return;

    const deltaX = swipeState.currentX - swipeState.startX;

    // If swiped right more than 50px, trigger reply
    if (deltaX > 50) {
      handleReplyToMessage(message);
    }

    // Reset swipe state
    setSwipeState({ startX: 0, currentX: 0, messageId: null, swiping: false });
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

  // Get swipe offset for visual feedback
  const getSwipeOffset = (messageId) => {
    if (swipeState.messageId !== messageId || !swipeState.swiping) return 0;
    const deltaX = swipeState.currentX - swipeState.startX;
    return Math.min(Math.max(deltaX, 0), 100); // Limit between 0 and 100px
  };

  // Send chat request with enhanced duplicate prevention
  const sendChatRequest = async () => {
    if (!requestRoll.trim()) {
      toast.error("Please enter a roll number");
      return;
    }

    if (requestRoll === userRoll) {
      toast.error("You cannot send a request to yourself");
      return;
    }

    setLoading(true);
    try {
      // First, validate if the user exists in the registered users from mino.js
      const userExists = users.some((user) => user.roll === requestRoll);

      if (!userExists) {
        toast.error(
          `User with roll number ${requestRoll} is not registered in the system`
        );
        setLoading(false);
        return;
      }

      // Use enhanced unique chat thread logic to check for existing chats
      const existingChat = await ensureUniqueChatThread(userRoll, requestRoll);
      
      if (existingChat && existingChat.status === "approved") {
        // Switch to chats tab to show the existing chat
        setActiveTab("chats");
        
        // Automatically open the existing chat
        setSelectedChat(existingChat);
        
        // Set this chat as active for the current user
        await set(ref(db, `activeChats/${userRoll}`), existingChat.id);
        
        // Clear the request input
        setRequestRoll("");
        
        toast.success("Opening your existing chat with this user!");
        setLoading(false);
        return;
      }

      // Check if request already exists (in both directions)
      const requestsRef = ref(db, "p2pChatRequests");
      const existingRequestQuery = query(requestsRef);
      const existingSnapshot = await get(existingRequestQuery);
      const existingRequests = existingSnapshot.val() || {};

      // Check for duplicate requests in both directions
      const duplicateRequest = Object.values(existingRequests).find(
        (req) =>
          ((req.fromRoll === userRoll && req.toRoll === requestRoll) ||
            (req.fromRoll === requestRoll && req.toRoll === userRoll)) &&
          req.status === "pending"
      );

      if (duplicateRequest) {
        if (
          duplicateRequest.fromRoll === requestRoll &&
          duplicateRequest.toRoll === userRoll
        ) {
          toast.error(
            "This user has already sent you a request! Check your requests tab."
          );
        } else {
          toast.error("Request already sent to this user");
        }
        setLoading(false);
        return;
      }

      // Get the target user's name from mino.js users array
      const targetUser = users.find((user) => user.roll === requestRoll);

      // Create new chat request
      await push(requestsRef, {
        fromRoll: userRoll,
        fromName: userName,
        toRoll: requestRoll,
        toName: targetUser?.name || "Unknown", // Add target user's name
        status: "pending",
        timestamp: serverTimestamp(),
      });

      toast.success(
        `Chat request sent to ${toProperCase(targetUser?.name) || requestRoll}!`
      );
      setRequestRoll("");
    } catch (error) {
      console.error("Error sending chat request:", error);
      toast.error("Failed to send chat request");
    } finally {
      setLoading(false);
    }
  };

  // Accept chat request with enhanced duplicate prevention
  const acceptChatRequest = async (request) => {
    if (!request || !request.id) {
      toast.error("Invalid request");
      return;
    }

    try {
      // Use enhanced unique chat thread logic
      const existingChat = await ensureUniqueChatThread(request.fromRoll, userRoll);

      if (existingChat && existingChat.status === "approved") {
        // Chat exists and is now unique - just update the request status
        const requestRef = ref(db, `p2pChatRequests/${request.id}`);
        await safeUpdate(requestRef, { status: "accepted" });

        // Mark any reverse requests as accepted to prevent confusion
        const requestsRef = ref(db, "p2pChatRequests");
        const allRequestsSnapshot = await get(requestsRef);
        const allRequests = allRequestsSnapshot.val() || {};

        Object.entries(allRequests).forEach(async ([reqId, req]) => {
          if (
            ((req.fromRoll === request.fromRoll && req.toRoll === userRoll) ||
              (req.fromRoll === userRoll && req.toRoll === request.fromRoll)) &&
            req.status === "pending"
          ) {
            await safeUpdate(ref(db, `p2pChatRequests/${reqId}`), {
              status: "accepted",
            });
          }
        });

        toast.success("Chat request accepted! All duplicate chats have been merged.");
        
        // Switch to chats tab and automatically open the merged chat
        setActiveTab("chats");
        setSelectedChat(existingChat);
        
        // Set this chat as active for the current user
        await set(ref(db, `activeChats/${userRoll}`), existingChat.id);
        
        return;
      }

      // No existing chat - create new one
      const chatsRef = ref(db, "p2pChats");
      const newChatRef = push(chatsRef);

      await set(newChatRef, {
        participants: [request.fromRoll, userRoll],
        participantNames: {
          [request.fromRoll]: request.fromName || "Unknown",
          [userRoll]: userName || "Unknown",
        },
        status: "approved",
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: "",
        lastMessageSender: null,
      });

      // Initialize unread counts for both users
      await set(
        ref(db, `unreadCounts/${request.fromRoll}/${newChatRef.key}`),
        0
      );
      await set(ref(db, `unreadCounts/${userRoll}/${newChatRef.key}`), 0);

      // Update request status
      const requestRef = ref(db, `p2pChatRequests/${request.id}`);
      await safeUpdate(requestRef, { status: "accepted" });

      // Mark any reverse requests as accepted
      const requestsRef = ref(db, "p2pChatRequests");
      const allRequestsSnapshot = await get(requestsRef);
      const allRequests = allRequestsSnapshot.val() || {};

      Object.entries(allRequests).forEach(async ([reqId, req]) => {
        if (
          req.fromRoll === userRoll &&
          req.toRoll === request.fromRoll &&
          req.status === "pending"
        ) {
          await safeUpdate(ref(db, `p2pChatRequests/${reqId}`), {
            status: "accepted",
          });
        }
      });

      toast.success(`Chat request accepted! You can now message with ${request.fromName}`);
      
      // Switch to chats tab and automatically open the new chat
      setActiveTab("chats");
      
      // Create a chat object to set as selected
      const newChatObject = {
        id: newChatRef.key,
        participants: [request.fromRoll, userRoll],
        participantNames: {
          [request.fromRoll]: request.fromName || "Unknown",
          [userRoll]: userName || "Unknown",
        },
        status: "approved",
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: "",
        lastMessageSender: null,
      };
      
      setSelectedChat(newChatObject);
      
      // Set this chat as active for the current user
      await set(ref(db, `activeChats/${userRoll}`), newChatRef.key);
    } catch (error) {
      console.error("Error accepting chat request:", error);
      toast.error("Failed to accept chat request");
    }
  };

  // Reject chat request
  const rejectChatRequest = async (request) => {
    if (!request || !request.id) {
      toast.error("Invalid request");
      return;
    }

    try {
      const requestRef = ref(db, `p2pChatRequests/${request.id}`);
      await safeUpdate(requestRef, { status: "rejected" });
      toast.success("Chat request rejected");
    } catch (error) {
      console.error("Error rejecting chat request:", error);
      toast.error("Failed to reject chat request");
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
      setNewMessage((prev) => prev + emoji);
    }

    // Close emoji panel
    setShowEmojiPanel(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    // Store the message text and clear input immediately for better UX
    const messageText = newMessage.trim();
    setNewMessage("");

    // Clear typing status before sending message
    clearTyping();

    try {
      const messagesRef = ref(db, `p2pMessages/${selectedChat.id}`);

      // Prepare message data
      const messageData = {
        text: messageText,
        senderRoll: userRoll,
        senderName: userName || "Unknown",
        timestamp: serverTimestamp(),
      };

      // Add reply information if replying to a message
      if (replyToMessage) {
        messageData.replyTo = {
          messageId: replyToMessage.id,
          text: replyToMessage.text,
          senderName: replyToMessage.senderName,
          senderRoll: replyToMessage.senderRoll,
        };
      }

      const newMessageRef = await push(messagesRef, messageData);

      // Clear reply state
      setReplyToMessage(null);

      // Update last message in chat
      const chatRef = ref(db, `p2pChats/${selectedChat.id}`);
      const updateData = {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: userRoll, // Track who sent the last message
      };

      await safeUpdate(chatRef, updateData);

      // Update unread count for the other participant (only if they don't have this chat open)
      const otherParticipant = getOtherParticipant(selectedChat);
      if (otherParticipant.roll) {
        // Check if the other user is currently viewing this chat
        const otherUserActiveRef = ref(
          db,
          `activeChats/${otherParticipant.roll}`
        );
        const activeSnapshot = await get(otherUserActiveRef);
        const otherUserActiveChat = activeSnapshot.val();

        // Only increment unread count if they're not currently viewing this chat
        if (otherUserActiveChat !== selectedChat.id) {
          const otherUserUnreadRef = ref(
            db,
            `unreadCounts/${otherParticipant.roll}/${selectedChat.id}`
          );
          const currentUnreadSnapshot = await get(otherUserUnreadRef);
          const currentCount = currentUnreadSnapshot.val() || 0;
          await set(otherUserUnreadRef, currentCount + 1);
        }
      }

      // Mark this message as read by sender immediately
      const readStatusRef = ref(
        db,
        `messageReadStatus/${selectedChat.id}/${newMessageRef.key}/${userRoll}`
      );
      await set(readStatusRef, {
        readAt: serverTimestamp(),
        readBy: userRoll,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      // Restore the message text if there was an error
      setNewMessage(messageText);
    }
  };

  // Get other participant info
  const getOtherParticipant = (chat) => {
    const otherRoll = chat.participants.find((roll) => roll !== userRoll);
    return {
      roll: otherRoll,
      name: chat.participantNames[otherRoll],
    };
  };

  // Check if user is online
  const isUserOnline = (userRoll) => {
    return activeUsers[userRoll]?.online || false;
  };

  // Get last seen time for offline users
  const getLastSeenTime = (userRoll) => {
    const userData = activeUsers[userRoll];
    if (!userData || userData.online) return null;
    return getRelativeTime(userData.lastSeen);
  };

  // Enhanced function to ensure only one chat thread between two users
  const ensureUniqueChatThread = async (userRoll1, userRoll2) => {
    try {
      const chatsRef = ref(db, "p2pChats");
      const snapshot = await get(chatsRef);
      const allChats = snapshot.val() || {};

      // Find all chats between these two users (including different statuses)
      const userChats = Object.entries(allChats)
        .map(([id, chat]) => ({ id, ...chat }))
        .filter((chat) => {
          const participants = chat.participants || [];
          return participants.includes(userRoll1) && participants.includes(userRoll2);
        })
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); // Sort by creation time

      if (userChats.length === 0) {
        return null; // No existing chat
      }

      if (userChats.length === 1) {
        return userChats[0]; // Single chat exists
      }

      console.log(`Found ${userChats.length} chat threads between ${userRoll1} and ${userRoll2}, merging to ensure uniqueness...`);

      // Multiple chats exist - merge them into the oldest one
      const primaryChat = userChats[0]; // Oldest chat becomes primary
      const duplicatesToMerge = userChats.slice(1);

      // Collect all messages from all chats
      let allMessages = [];
      const messagePromises = userChats.map(async (chat) => {
        const messagesRef = ref(db, `p2pMessages/${chat.id}`);
        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};

        return Object.entries(messages).map(([msgId, message]) => ({
          ...message,
          originalChatId: chat.id,
          messageId: msgId,
        }));
      });

      const messageResults = await Promise.all(messagePromises);
      allMessages = messageResults.flat();

      // Sort messages by timestamp to maintain chronological order
      allMessages.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      // Remove duplicate messages based on content and timestamp
      const uniqueMessages = [];
      const messageHashes = new Set();
      
      allMessages.forEach((message) => {
        const messageHash = `${message.senderRoll}-${message.text}-${message.timestamp}`;
        if (!messageHashes.has(messageHash)) {
          messageHashes.add(messageHash);
          uniqueMessages.push(message);
        }
      });

      // Clear primary chat messages and add all unique messages
      const primaryMessagesRef = ref(db, `p2pMessages/${primaryChat.id}`);
      await set(primaryMessagesRef, {});

      // Add all unique messages to primary chat
      for (const message of uniqueMessages) {
        const { originalChatId, messageId, ...messageData } = message;
        await push(primaryMessagesRef, messageData);
      }

      // Update primary chat with the most recent message info
      if (uniqueMessages.length > 0) {
        const latestMessage = uniqueMessages[uniqueMessages.length - 1];
        
        // Ensure primary chat has approved status
        const updateData = {
          status: "approved", // Ensure the merged chat is approved
          lastMessage: latestMessage.text || "",
          lastMessageTime: latestMessage.timestamp || serverTimestamp(),
          lastMessageSender: latestMessage.senderRoll || null,
          // Ensure participant names are preserved
          participantNames: {
            [userRoll1]: primaryChat.participantNames?.[userRoll1] || users.find(u => u.roll === userRoll1)?.name || "Unknown",
            [userRoll2]: primaryChat.participantNames?.[userRoll2] || users.find(u => u.roll === userRoll2)?.name || "Unknown"
          }
        };

        await safeUpdate(ref(db, `p2pChats/${primaryChat.id}`), updateData);
      }

      // Clean up duplicate chats
      for (const chat of duplicatesToMerge) {
        // Delete the duplicate chat
        await set(ref(db, `p2pChats/${chat.id}`), null);
        await set(ref(db, `p2pMessages/${chat.id}`), null);

        // Clean up related data for duplicate chats
        for (const participant of chat.participants || []) {
          await set(ref(db, `unreadCounts/${participant}/${chat.id}`), null);
          
          // Update active chat references if they were viewing this duplicate
          const activeSnapshot = await get(ref(db, `activeChats/${participant}`));
          if (activeSnapshot.val() === chat.id) {
            await set(ref(db, `activeChats/${participant}`), primaryChat.id);
          }
        }

        // Clean up read status and typing indicators for duplicate chats
        await set(ref(db, `messageReadStatus/${chat.id}`), null);
        await set(ref(db, `typing/${chat.id}`), null);
      }

      // Clean up any orphaned pending requests between these users
      const requestsRef = ref(db, "p2pChatRequests");
      const requestsSnapshot = await get(requestsRef);
      const allRequests = requestsSnapshot.val() || {};

      Object.entries(allRequests).forEach(async ([reqId, req]) => {
        if (
          ((req.fromRoll === userRoll1 && req.toRoll === userRoll2) ||
           (req.fromRoll === userRoll2 && req.toRoll === userRoll1)) &&
          req.status === "pending"
        ) {
          await safeUpdate(ref(db, `p2pChatRequests/${reqId}`), {
            status: "accepted",
          });
        }
      });

      toast.success(`Merged ${duplicatesToMerge.length + 1} chat threads into one!`);
      return primaryChat;
    } catch (error) {
      console.error("Error ensuring unique chat thread:", error);
      throw error;
    }
  };

  // Merge duplicate chat threads
  const mergeDuplicateChats = async (userRoll1, userRoll2) => {
    return await ensureUniqueChatThread(userRoll1, userRoll2);
  };

  // Load older messages
  const loadOlderMessages = async () => {
    if (!selectedChat || loadingOlder) return;

    setLoadingOlder(true);
    try {
      const messagesRef = ref(db, `p2pMessages/${selectedChat.id}`);
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

  // Add state for smooth transitions
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle smooth modal transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-[60] flex flex-col transition-all duration-300 ease-in-out transform ${
      isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
    }`}>
      <style jsx>{`
        /* Custom scrollbar styling for the entire P2P chat */
        .p2p-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .p2p-scrollbar::-webkit-scrollbar-track {
          background: rgb(243 244 246);
          border-radius: 8px;
        }

        .p2p-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(156 163 175);
          border-radius: 8px;
          border: 2px solid rgb(243 244 246);
        }

        .p2p-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128);
        }

        /* Dark mode scrollbar */
        .dark .p2p-scrollbar::-webkit-scrollbar-track {
          background: rgb(31 41 55);
        }

        .dark .p2p-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(75 85 99);
          border: 2px solid rgb(31 41 55);
        }

        .dark .p2p-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128);
        }

        /* Firefox scrollbar */
        .p2p-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(156 163 175) rgb(243 244 246);
        }

        .dark .p2p-scrollbar {
          scrollbar-color: rgb(75 85 99) rgb(31 41 55);
        }
      `}</style>
      <div className="w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm relative">
              <i className="fas fa-comments text-white"></i>
              {getTotalUnreadCount() > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {getTotalUnreadCount() > 9 ? "9+" : getTotalUnreadCount()}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
              P2P Chat
              {getTotalUnreadCount() > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {getTotalUnreadCount()} unread
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-gray-500 text-sm sm:text-base md:text-lg"></i>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* Sidebar - Hidden on mobile when chat is selected */}
          <div
            className={`${
              selectedChat ? "hidden sm:flex" : "flex"
            } w-full sm:w-80 md:w-96 lg:w-1/3 xl:w-1/4 border-r border-gray-200 dark:border-gray-700 flex-col sm:flex-shrink-0 bg-white dark:bg-gray-800`}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("chats")}
                className={`flex-1 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors relative ${
                  activeTab === "chats"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span className="hidden xs:inline">
                  Chats
                  {approvedChats.length > 0 && ` (${approvedChats.length})`}
                  {getTotalUnreadCount() > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {getTotalUnreadCount() > 99
                        ? "99+"
                        : getTotalUnreadCount()}
                    </span>
                  )}
                </span>
                <span className="xs:hidden">
                  <i className="fas fa-comments mr-1"></i>
                  {approvedChats.length > 0 && approvedChats.length}
                  {getTotalUnreadCount() > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {getTotalUnreadCount() > 9 ? "9+" : getTotalUnreadCount()}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors relative ${
                  activeTab === "requests"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : chatRequests.length > 0
                    ? "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span className="hidden xs:inline">
                  Requests
                  {chatRequests.length > 0 && ` (${chatRequests.length})`}
                  {chatRequests.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                      {chatRequests.length > 9 ? "9+" : chatRequests.length}
                    </span>
                  )}
                </span>
                <span className="xs:hidden">
                  <i className="fas fa-paper-plane mr-1"></i>
                  {chatRequests.length > 0 && chatRequests.length}
                  {chatRequests.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                      {chatRequests.length > 9 ? "9+" : chatRequests.length}
                    </span>
                  )}
                </span>
                {chatRequests.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p2p-scrollbar">
              {activeTab === "chats" ? (
                <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                  {/* New Chat Request */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Start New Chat
                    </h3>
                    <div className="flex gap-2 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Enter roll number"
                        value={requestRoll}
                        onChange={(e) => setRequestRoll(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) =>
                          e.key === "Enter" && sendChatRequest()
                        }
                      />
                      <button
                        onClick={sendChatRequest}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                      >
                        {loading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Approved Chats */}
                  {approvedChats.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-comments text-2xl sm:text-3xl mb-3 opacity-50"></i>
                      <p className="text-sm sm:text-base">No chats yet</p>
                    </div>
                  ) : (
                    approvedChats.map((chat) => {
                      const otherParticipant = getOtherParticipant(chat);
                      const unreadCount = getUnreadCount(chat.id);
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-colors relative ${
                            selectedChat?.id === chat.id
                              ? "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0 relative">
                              {toProperCase(otherParticipant.name)?.charAt(0) ||
                                otherParticipant.roll?.charAt(0)}
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p
                                    className={`text-sm sm:text-base font-medium truncate ${
                                      unreadCount > 0
                                        ? "text-gray-900 dark:text-gray-100 font-semibold"
                                        : "text-gray-900 dark:text-gray-100"
                                    }`}
                                  >
                                    {toProperCase(otherParticipant.name) ||
                                      otherParticipant.roll}
                                  </p>
                                  {isUserOnline(otherParticipant.roll) ? (
                                    <div
                                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full flex-shrink-0"
                                      title="Online"
                                    ></div>
                                  ) : (
                                    getLastSeenTime(otherParticipant.roll) && (
                                      <span
                                        className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
                                        title={`Last seen ${getLastSeenTime(
                                          otherParticipant.roll
                                        )} ago`}
                                      >
                                        •{" "}
                                        {getLastSeenTime(otherParticipant.roll)}
                                      </span>
                                    )
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {getRelativeTime(chat.lastMessageTime)}
                                  </span>
                                  {unreadCount > 0 && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              <p
                                className={`text-xs sm:text-sm truncate mt-1 ${
                                  unreadCount > 0
                                    ? "text-gray-700 dark:text-gray-300 font-medium"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {chat.lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                  {chatRequests.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-inbox text-2xl sm:text-3xl mb-3 opacity-50"></i>
                      <p className="text-sm sm:text-base">
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    chatRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">
                            {toProperCase(request.fromName)?.charAt(0) ||
                              request.fromRoll?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                              {toProperCase(request.fromName) ||
                                request.fromRoll}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Roll: {request.fromRoll}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => acceptChatRequest(request)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectChatRequest(request)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area - Hidden on mobile when no chat selected */}
          <div
            className={`${
              selectedChat ? "flex" : "hidden sm:flex"
            } flex-1 flex-col min-w-0 bg-white dark:bg-gray-900`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-2"
                    >
                      <i className="fas fa-arrow-left text-gray-600 dark:text-gray-400 text-base"></i>
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                      {toProperCase(
                        getOtherParticipant(selectedChat).name
                      )?.charAt(0) ||
                        getOtherParticipant(selectedChat).roll?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-lg truncate">
                          {toProperCase(
                            getOtherParticipant(selectedChat).name
                          ) || getOtherParticipant(selectedChat).roll}
                        </h3>
                        {isUserOnline(
                          getOtherParticipant(selectedChat).roll
                        ) && (
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"
                            title="Online"
                          ></div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400">
                        Roll: {getOtherParticipant(selectedChat).roll}
                        {isUserOnline(
                          getOtherParticipant(selectedChat).roll
                        ) ? (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            • Online
                          </span>
                        ) : (
                          getLastSeenTime(
                            getOtherParticipant(selectedChat).roll
                          ) && (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              • Last seen{" "}
                              {getLastSeenTime(
                                getOtherParticipant(selectedChat).roll
                              )}{" "}
                              ago
                            </span>
                          )
                        )}
                        {getTypingUsers().some(
                          (user) =>
                            user.roll === getOtherParticipant(selectedChat).roll
                        ) && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                            • typing...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 sm:space-y-2 min-h-0 p2p-scrollbar">
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
                    const messageStatus = getMessageStatus(
                      message.id,
                      message.senderRoll
                    );
                    const swipeOffset = getSwipeOffset(message.id);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwnMessage ? "justify-end " : "justify-start "
                        } group relative mb-0.5`}
                      >
                        {/* Reply icon that appears during swipe (mobile only) */}
                        {swipeOffset > 10 && (
                          <div
                            className={`absolute ${
                              isOwnMessage ? "left-0" : "right-0"
                            } top-1/2 transform -translate-y-1/2 transition-opacity duration-150 sm:hidden`}
                            style={{ opacity: Math.min(swipeOffset / 50, 1) }}
                          >
                            <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                              >
                                <path d="M8.354 1.646a.5.5 0 0 1 0 .708L5.707 5H14.5a.5.5 0 0 1 0 1H5.707l2.647 2.646a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg relative transition-transform duration-150 ${
                            isOwnMessage
                              ? "bg-indigo-600 text-white "
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 "
                          }`}
                          style={{
                            transform: `translateX(${swipeOffset}px)`,
                            touchAction: "pan-y", // Allow vertical scrolling but capture horizontal swipes
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
                          {/* Reply button (desktop hover) */}
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className={`absolute -top-2 ${
                              isOwnMessage ? "-left-8" : "-right-8"
                            } opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 text-xs hidden sm:block`}
                            title="Reply"
                          >
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M8.354 1.646a.5.5 0 0 1 0 .708L5.707 5H14.5a.5.5 0 0 1 0 1H5.707l2.647 2.646a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z" />
                            </svg>
                          </button>

                          {/* Show replied message context */}
                          {message.replyTo && (
                            <div
                              className={`mb-1.5 p-1.5 rounded border-l-4 ${
                                isOwnMessage
                                  ? "bg-indigo-700/50 border-indigo-300"
                                  : "bg-gray-300 dark:bg-gray-600 border-gray-500"
                              }`}
                            >
                              <p
                                className={`text-xs font-medium ${
                                  isOwnMessage
                                    ? "text-indigo-200"
                                    : "text-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {message.replyTo.senderRoll === userRoll
                                  ? "You"
                                  : toProperCase(message.replyTo.senderName)}
                              </p>
                              <p
                                className={`text-xs mt-.5 truncate ${
                                  isOwnMessage
                                    ? "text-indigo-100"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {message.replyTo.text}
                              </p>
                            </div>
                          )}

                          {/* Message text */}
                          <p className="text-sm sm:text-base break-words"
                             style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
                            {message.text}
                          </p>

                          {/* Link previews and embeds */}
                          {(() => {
                            const detectedLinks = detectLinks(message.text);
                            if (detectedLinks.length === 0) return null;

                            return detectedLinks.map((link, index) => {
                              // Render YouTube embed
                              if (
                                link.platform === SUPPORTED_PLATFORMS.YOUTUBE &&
                                link.videoId
                              ) {
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

                          <div className="flex items-center justify-between mt-.5">
                            <p
                              className={`text-xs ${
                                isOwnMessage
                                  ? "text-indigo-100"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {getRelativeTime(message.timestamp)}
                            </p>
                            {isOwnMessage && (
                              <div
                                className={`${
                                  isOwnMessage
                                    ? "text-indigo-100"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {renderMessageStatus(messageStatus)}
                              </div>
                            )}
                          </div>

                          {/* Message Reactions - Real-time updates */}
                          <MessageReactions
                            messageId={message.id}
                            chatPath={`p2pChats/${selectedChat.id}`}
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

                  {/* Typing Indicator */}
                  {getTypingUsers().length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg max-w-[75%] sm:max-w-[65%]">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {getTypingUsers().length === 1
                              ? `${getTypingUsers()[0].userName} is typing...`
                              : `${
                                  getTypingUsers().length
                                } people are typing...`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                  {/* Reply Preview */}
                  {replyToMessage && (
                    <div className="px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Replying to{" "}
                            {replyToMessage.senderRoll === userRoll
                              ? "yourself"
                              : toProperCase(replyToMessage.senderName)}
                          </p>
                          <button
                            onClick={cancelReply}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
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
                      <div className="flex gap-2 sm:gap-3 md:gap-4">
                        <div className="flex-1 relative">
                          <input
                            ref={messageInputRef}
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              if (e.target.value.trim()) {
                                handleTyping();
                              } else {
                                clearTyping();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            onBlur={clearTyping}
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 sm:p-6">
                <div className="text-center">
                  <i className="fas fa-comments text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 opacity-50"></i>
                  <p className="text-base sm:text-lg md:text-xl">
                    Select a chat to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PChat;
