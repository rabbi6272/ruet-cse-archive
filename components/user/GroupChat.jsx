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

const GroupChat = ({ userRoll, userName, isOpen, onClose }) => {
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
  const [swipeState, setSwipeState] = useState({ startX: 0, currentX: 0, messageId: null, swiping: false });

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

  useEffect(() => {
    if (userGroup) {
      scrollToBottom();
    }
  }, [messages, userGroup]);

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
    }, (error) => {
      console.error("Error listening to unread count:", error);
    });

    return () => unsubscribeUnread();
  }, [userRoll, isOpen, userGroup]);

  // Mark messages as read when group is active
  useEffect(() => {
    if (!userGroup || !userRoll) return;

    const markAsRead = async () => {
      try {
        // Clear unread count
        const unreadRef = ref(db, `groupUnreadCounts/${userGroup.id}/${userRoll}`);
        await set(unreadRef, 0);

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

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userGroup) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    clearTyping();

    try {
      const messagesRef = ref(db, `groupMessages/${userGroup.id}`);
      
      const messageData = {
        text: messageText,
        senderRoll: userRoll,
        senderName: userName || "Unknown",
        timestamp: serverTimestamp(),
      };

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

      // Update unread counts for all other group members
      for (const participantRoll of userGroup.participants) {
        if (participantRoll !== userRoll) {
          const unreadRef = ref(db, `groupUnreadCounts/${userGroup.id}/${participantRoll}`);
          const currentSnapshot = await get(unreadRef);
          const currentCount = currentSnapshot.val() || 0;
          await set(unreadRef, currentCount + 1);
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
                  className={`max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%] px-3 sm:px-4 py-2 sm:py-3 rounded-lg relative transition-transform duration-150 ${
                    isOwnMessage
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                  style={{
                    transform: `translateX(${swipeOffset}px)`,
                    touchAction: 'pan-y'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, message)}
                  onTouchMove={(e) => handleTouchMove(e, message)}
                  onTouchEnd={(e) => handleTouchEnd(e, message)}
                >
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

                  <p className="text-sm sm:text-base break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage
                        ? "text-indigo-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {getRelativeTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

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
            <div className="flex gap-2 sm:gap-3 md:gap-4">
              <input
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
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              />
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
  );
};

export default GroupChat;
