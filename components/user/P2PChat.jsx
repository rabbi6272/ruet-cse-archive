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
  const [swipeState, setSwipeState] = useState({ startX: 0, currentX: 0, messageId: null, swiping: false });

  // Convert name to proper case (first letter of each word capitalized)
  const toProperCase = (name) => {
    if (!name || typeof name !== 'string') return name;
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Safe update wrapper to prevent null/undefined values
  const safeUpdate = async (dbRef, updateData) => {
    try {
      if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
        console.warn("Invalid update data:", updateData);
        return;
      }
      
      // Filter out null/undefined values
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
    if (selectedChat) {
      scrollToBottom();
    }
  }, [messages, selectedChat]);

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
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      // Check for and merge duplicate chats automatically
      const userPairs = new Set();
      const duplicates = [];
      
      chats.forEach(chat => {
        const otherUser = chat.participants.find(p => p !== userRoll);
        const pairKey = [userRoll, otherUser].sort().join('-');
        
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
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTypingStates(data);
    }, (error) => {
      console.error("Error listening to typing status:", error);
    });

    // Clean up typing status when leaving chat
    return () => {
      unsubscribeTyping();
      // Clear user's typing status when leaving chat
      if (selectedChat?.id && userRoll) {
        set(ref(db, `typing/${selectedChat.id}/${userRoll}`), null).catch(console.error);
      }
    };
  }, [selectedChat, userRoll]);

  // Track unread counts for all chats
  useEffect(() => {
    if (!userRoll || !isOpen) return;

    const unreadRef = ref(db, `unreadCounts/${userRoll}`);
    
    const unsubscribeUnread = onValue(unreadRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUnreadCounts(data);
    }, (error) => {
      console.error("Error listening to unread counts:", error);
    });

    return () => unsubscribeUnread();
  }, [userRoll, isOpen]);

  // Track message read status for selected chat
  useEffect(() => {
    if (!selectedChat || !userRoll) return;

    const readStatusRef = ref(db, `messageReadStatus/${selectedChat.id}`);
    
    const unsubscribeReadStatus = onValue(readStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMessageReadStatus(data);
    }, (error) => {
      console.error("Error listening to message read status:", error);
    });

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
        const unreadRef = ref(db, `unreadCounts/${userRoll}/${selectedChat.id}`);
        await set(unreadRef, null);

        // Mark all messages in this chat as read by this user
        const readStatusRef = ref(db, `messageReadStatus/${selectedChat.id}`);
        const messagesRef = ref(db, `p2pMessages/${selectedChat.id}`);
        
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
      userName: userName || "Unknown"
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
      .filter(([roll, data]) => 
        roll !== userRoll && 
        data?.isTyping && 
        Date.now() - new Date(data.timestamp).getTime() < 5000 // 5 seconds timeout
      )
      .map(([roll, data]) => ({
        roll,
        userName: data.userName || roll
      }));
  };

  // Get unread count for a specific chat
  const getUnreadCount = (chatId) => {
    // Find the chat to check if last message was sent by current user
    const chat = approvedChats.find(c => c.id === chatId);
    if (chat && chat.lastMessageSender === userRoll) {
      // If current user sent the last message, don't show unread count
      return 0;
    }
    return unreadCounts[chatId] || 0;
  };

  // Get total unread count across all chats
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((total, count) => total + (count || 0), 0);
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
      return 'sent';
    }

    // Check if the other participant has read it
    const otherParticipant = getOtherParticipant(selectedChat);
    if (readStatus[otherParticipant.roll]) {
      // Message read by other participant - double tick
      return 'read';
    }

    // Message sent but not read yet - single tick
    return 'sent';
  };

  // Render message status icon
  const renderMessageStatus = (status) => {
    if (!status) return null;

    if (status === 'sent') {
      return (
        <span className="ml-2 text-xs opacity-70 flex items-center" title="Sent">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        </span>
      );
    }

    if (status === 'read') {
      return (
        <span className="ml-2 text-xs opacity-70 flex items-center" title="Read">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
          <svg className="w-4 h-4 -ml-2" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
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
      swiping: false
    });
  };

  // Handle touch move for swipe detection
  const handleTouchMove = (e, message) => {
    if (swipeState.messageId !== message.id) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    
    // Only allow swipe right (positive deltaX) and limit the distance
    if (deltaX > 0 && deltaX <= 100) {
      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        swiping: Math.abs(deltaX) > 10 // Start showing swipe indicator after 10px
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

  // Get swipe offset for visual feedback
  const getSwipeOffset = (messageId) => {
    if (swipeState.messageId !== messageId || !swipeState.swiping) return 0;
    const deltaX = swipeState.currentX - swipeState.startX;
    return Math.min(Math.max(deltaX, 0), 100); // Limit between 0 and 100px
  };

  // Send chat request
  const sendChatRequest = async () => {
    if (!requestRoll.trim()) {
      toast.error("Please enter a roll number");
      return;
    }

    // Validate roll number format (must be exactly 7 digits)
    const rollPattern = /^\d{7}$/;
    if (!rollPattern.test(requestRoll.trim())) {
      toast.error("Roll number must be exactly 7 digits");
      return;
    }

    if (requestRoll === userRoll) {
      toast.error("You cannot send a request to yourself");
      return;
    }

    setLoading(true);
    try {
      // First, validate if the user exists in the registered users
      const studentsRef = ref(db, "students");
      const studentsSnapshot = await get(studentsRef);
      const studentsData = studentsSnapshot.val() || {};
      
      // Check if user exists in students database
      const userExists = Object.values(studentsData).some(
        (student) => student.roll === requestRoll
      );

      if (!userExists) {
        toast.error(`User with roll number ${requestRoll} is not registered in the system`);
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
          (req.status === "pending" || req.status === "accepted")
      );

      if (duplicateRequest) {
        if (duplicateRequest.fromRoll === requestRoll && duplicateRequest.toRoll === userRoll) {
          toast.error("This user has already sent you a request! Check your requests tab.");
        } else {
          toast.error("Request already sent to this user");
        }
        setLoading(false);
        return;
      }

      // Check if chat already exists between these users
      const chatsRef = ref(db, "p2pChats");
      const existingChatQuery = query(chatsRef);
      const chatSnapshot = await get(existingChatQuery);
      const existingChats = chatSnapshot.val() || {};
      
      const existingChatsList = Object.values(existingChats).filter(
        (chat) =>
          chat.participants?.includes(userRoll) &&
          chat.participants?.includes(requestRoll) &&
          chat.status === "approved"
      );

      if (existingChatsList.length > 0) {
        if (existingChatsList.length > 1) {
          // Multiple chats exist, merge them
          await mergeDuplicateChats(userRoll, requestRoll);
        }
        toast.error("Chat already exists with this user");
        setLoading(false);
        return;
      }

      // Get the target user's name from students data
      const targetUser = Object.values(studentsData).find(
        (student) => student.roll === requestRoll
      );

      await push(requestsRef, {
        fromRoll: userRoll,
        fromName: userName,
        toRoll: requestRoll,
        toName: targetUser?.name || "Unknown", // Add target user's name
        status: "pending",
        timestamp: serverTimestamp(),
      });

      toast.success(`Chat request sent to ${toProperCase(targetUser?.name) || requestRoll}!`);
      setRequestRoll("");
    } catch (error) {
      console.error("Error sending chat request:", error);
      toast.error("Failed to send chat request");
    } finally {
      setLoading(false);
    }
  };

  // Accept chat request
  const acceptChatRequest = async (request) => {
    if (!request || !request.id) {
      toast.error("Invalid request");
      return;
    }

    try {
      // First, check if multiple chats exist between these users and merge them
      const chatsRef = ref(db, "p2pChats");
      const existingChatQuery = query(chatsRef);
      const chatSnapshot = await get(existingChatQuery);
      const existingChats = chatSnapshot.val() || {};
      
      const existingChatsList = Object.values(existingChats).filter(
        (chat) =>
          chat.participants?.includes(request.fromRoll) &&
          chat.participants?.includes(userRoll) &&
          chat.status === "approved"
      );

      if (existingChatsList.length > 1) {
        // Multiple chats exist, merge them first
        await mergeDuplicateChats(request.fromRoll, userRoll);
        
        // Update request status after merging
        const requestRef = ref(db, `p2pChatRequests/${request.id}`);
        await safeUpdate(requestRef, { status: "accepted" });
        
        toast.success("Duplicate chats merged! You can start messaging now.");
        return;
      } else if (existingChatsList.length === 1) {
        // Single chat exists
        const requestRef = ref(db, `p2pChatRequests/${request.id}`);
        await safeUpdate(requestRef, { status: "accepted" });
        
        // Also mark any reverse requests as accepted to prevent confusion
        const requestsRef = ref(db, "p2pChatRequests");
        const allRequestsSnapshot = await get(requestsRef);
        const allRequests = allRequestsSnapshot.val() || {};
        
        Object.entries(allRequests).forEach(async ([reqId, req]) => {
          if (
            ((req.fromRoll === request.fromRoll && req.toRoll === userRoll) ||
             (req.fromRoll === userRoll && req.toRoll === request.fromRoll)) &&
            req.status === "pending"
          ) {
            await safeUpdate(ref(db, `p2pChatRequests/${reqId}`), { status: "accepted" });
          }
        });
        
        toast.success("Chat already exists! You can start messaging now.");
        return;
      }

      // Create approved chat
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
        lastMessageSender: null, // No sender for initial empty message
      });

      // Initialize unread counts for both users
      await set(ref(db, `unreadCounts/${request.fromRoll}/${newChatRef.key}`), 0);
      await set(ref(db, `unreadCounts/${userRoll}/${newChatRef.key}`), 0);

      // Update request status
      const requestRef = ref(db, `p2pChatRequests/${request.id}`);
      await safeUpdate(requestRef, { status: "accepted" });

      // Also mark any reverse requests as accepted
      const requestsRef = ref(db, "p2pChatRequests");
      const allRequestsSnapshot = await get(requestsRef);
      const allRequests = allRequestsSnapshot.val() || {};
      
      Object.entries(allRequests).forEach(async ([reqId, req]) => {
        if (
          req.fromRoll === userRoll &&
          req.toRoll === request.fromRoll &&
          req.status === "pending"
        ) {
          await safeUpdate(ref(db, `p2pChatRequests/${reqId}`), { status: "accepted" });
        }
      });

      toast.success("Chat request accepted!");
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
        const otherUserActiveRef = ref(db, `activeChats/${otherParticipant.roll}`);
        const activeSnapshot = await get(otherUserActiveRef);
        const otherUserActiveChat = activeSnapshot.val();
        
        // Only increment unread count if they're not currently viewing this chat
        if (otherUserActiveChat !== selectedChat.id) {
          const otherUserUnreadRef = ref(db, `unreadCounts/${otherParticipant.roll}/${selectedChat.id}`);
          const currentUnreadSnapshot = await get(otherUserUnreadRef);
          const currentCount = currentUnreadSnapshot.val() || 0;
          await set(otherUserUnreadRef, currentCount + 1);
        }
      }

      // Mark this message as read by sender immediately
      const readStatusRef = ref(db, `messageReadStatus/${selectedChat.id}/${newMessageRef.key}/${userRoll}`);
      await set(readStatusRef, {
        readAt: serverTimestamp(),
        readBy: userRoll
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

  // Merge duplicate chat threads
  const mergeDuplicateChats = async (userRoll1, userRoll2) => {
    try {
      const chatsRef = ref(db, "p2pChats");
      const snapshot = await get(chatsRef);
      const allChats = snapshot.val() || {};
      
      // Find all chats between these two users
      const duplicateChats = Object.entries(allChats)
        .map(([id, chat]) => ({ id, ...chat }))
        .filter(chat => 
          chat.participants?.includes(userRoll1) &&
          chat.participants?.includes(userRoll2) &&
          chat.status === "approved"
        );

      if (duplicateChats.length <= 1) {
        return duplicateChats[0] || null; // No duplicates or no chats
      }

      console.log(`Found ${duplicateChats.length} duplicate chats, merging...`);

      // Sort by creation time to keep the oldest as primary
      duplicateChats.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const primaryChat = duplicateChats[0];
      const duplicatesToMerge = duplicateChats.slice(1);

      // Collect all messages from duplicate chats
      let allMessages = [];
      
      for (const chat of duplicateChats) {
        const messagesRef = ref(db, `p2pMessages/${chat.id}`);
        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};
        
        Object.entries(messages).forEach(([msgId, message]) => {
          allMessages.push({
            ...message,
            originalChatId: chat.id,
            messageId: msgId
          });
        });
      }

      // Sort messages by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Clear primary chat messages and re-add all sorted messages
      const primaryMessagesRef = ref(db, `p2pMessages/${primaryChat.id}`);
      await set(primaryMessagesRef, {});

      // Add all messages to primary chat
      for (const message of allMessages) {
        const { originalChatId, messageId, ...messageData } = message;
        await push(primaryMessagesRef, messageData);
      }

      // Update primary chat with latest message info
      if (allMessages.length > 0) {
        const latestMessage = allMessages[allMessages.length - 1];
        const updateData = {
          lastMessage: latestMessage.text || "",
          lastMessageTime: latestMessage.timestamp || serverTimestamp(),
          lastMessageSender: latestMessage.senderRoll || null,
        };
        
        // Validate update data before Firebase call
        if (updateData && typeof updateData === 'object' && Object.keys(updateData).length > 0) {
          await safeUpdate(ref(db, `p2pChats/${primaryChat.id}`), updateData);
        }
      }

      // Delete duplicate chats and their messages
      for (const chat of duplicatesToMerge) {
        await set(ref(db, `p2pChats/${chat.id}`), null);
        await set(ref(db, `p2pMessages/${chat.id}`), null);
        
        // Clean up unread counts for duplicate chats
        for (const participant of chat.participants) {
          await set(ref(db, `unreadCounts/${participant}/${chat.id}`), null);
          // Also clear active chat references if they were viewing this duplicate
          const activeSnapshot = await get(ref(db, `activeChats/${participant}`));
          if (activeSnapshot.val() === chat.id) {
            await set(ref(db, `activeChats/${participant}`), primaryChat.id);
          }
        }
        
        // Clean up read status for duplicate chats
        await set(ref(db, `messageReadStatus/${chat.id}`), null);
      }

      toast.success(`Merged ${duplicateChats.length} duplicate chats into one conversation!`);
      return primaryChat;

    } catch (error) {
      console.error("Error merging duplicate chats:", error);
      toast.error("Failed to merge duplicate chats");
      return null;
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col">
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
                    {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
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
          <div className={`${selectedChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-96 lg:w-1/3 xl:w-1/4 border-r border-gray-200 dark:border-gray-700 flex-col sm:flex-shrink-0 bg-white dark:bg-gray-800`}>
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
                  Chats{approvedChats.length > 0 && ` (${approvedChats.length})`}
                  {getTotalUnreadCount() > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
                    </span>
                  )}
                </span>
                <span className="xs:hidden">
                  <i className="fas fa-comments mr-1"></i>
                  {approvedChats.length > 0 && approvedChats.length}
                  {getTotalUnreadCount() > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
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
                  Requests{chatRequests.length > 0 && ` (${chatRequests.length})`}
                  {chatRequests.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                      {chatRequests.length > 9 ? '9+' : chatRequests.length}
                    </span>
                  )}
                </span>
                <span className="xs:hidden">
                  <i className="fas fa-paper-plane mr-1"></i>
                  {chatRequests.length > 0 && chatRequests.length}
                  {chatRequests.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                      {chatRequests.length > 9 ? '9+' : chatRequests.length}
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
                <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                  {/* New Chat Request */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Start New Chat
                    </h3>
                    <div className="flex gap-2 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Enter 7-digit roll number"
                        value={requestRoll}
                        onChange={(e) => {
                          // Only allow numeric input and limit to 7 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                          setRequestRoll(value);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) => e.key === "Enter" && sendChatRequest()}
                        maxLength={7}
                      />
                      <button
                        onClick={sendChatRequest}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                      >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : "Send"}
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
                              {toProperCase(otherParticipant.name)?.charAt(0) || otherParticipant.roll?.charAt(0)}
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className={`text-sm sm:text-base font-medium truncate ${
                                    unreadCount > 0 
                                      ? "text-gray-900 dark:text-gray-100 font-semibold" 
                                      : "text-gray-900 dark:text-gray-100"
                                  }`}>
                                    {toProperCase(otherParticipant.name) || otherParticipant.roll}
                                  </p>
                                  {isUserOnline(otherParticipant.roll) ? (
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full flex-shrink-0" title="Online"></div>
                                  ) : (
                                    getLastSeenTime(otherParticipant.roll) && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0" title={`Last seen ${getLastSeenTime(otherParticipant.roll)} ago`}>
                                        • {getLastSeenTime(otherParticipant.roll)}
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
                              <p className={`text-xs sm:text-sm truncate mt-1 ${
                                unreadCount > 0 
                                  ? "text-gray-700 dark:text-gray-300 font-medium" 
                                  : "text-gray-500 dark:text-gray-400"
                              }`}>
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
                <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                  {chatRequests.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-inbox text-2xl sm:text-3xl mb-3 opacity-50"></i>
                      <p className="text-sm sm:text-base">No pending requests</p>
                    </div>
                  ) : (
                    chatRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">
                            {toProperCase(request.fromName)?.charAt(0) || request.fromRoll?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                              {toProperCase(request.fromName) || request.fromRoll}
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
          <div className={`${selectedChat ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0 bg-white dark:bg-gray-900`}>
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
                      {toProperCase(getOtherParticipant(selectedChat).name)?.charAt(0) || 
                       getOtherParticipant(selectedChat).roll?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-lg truncate">
                          {toProperCase(getOtherParticipant(selectedChat).name) || 
                           getOtherParticipant(selectedChat).roll}
                        </h3>
                        {isUserOnline(getOtherParticipant(selectedChat).roll) && (
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0" title="Online"></div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400">
                        Roll: {getOtherParticipant(selectedChat).roll}
                        {isUserOnline(getOtherParticipant(selectedChat).roll) ? (
                          <span className="ml-2 text-green-600 dark:text-green-400">• Online</span>
                        ) : (
                          getLastSeenTime(getOtherParticipant(selectedChat).roll) && (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              • Last seen {getLastSeenTime(getOtherParticipant(selectedChat).roll)} ago
                            </span>
                          )
                        )}
                        {getTypingUsers().some(user => user.roll === getOtherParticipant(selectedChat).roll) && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                            • typing...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 min-h-0 p2p-scrollbar">
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
                    const messageStatus = getMessageStatus(message.id, message.senderRoll);
                    const swipeOffset = getSwipeOffset(message.id);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group relative`}
                      >
                        {/* Reply icon that appears during swipe (mobile only) */}
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
                            touchAction: 'pan-y' // Allow vertical scrolling but capture horizontal swipes
                          }}
                          onTouchStart={(e) => handleTouchStart(e, message)}
                          onTouchMove={(e) => handleTouchMove(e, message)}
                          onTouchEnd={(e) => handleTouchEnd(e, message)}
                        >
                          {/* Reply button (desktop hover) */}
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className={`absolute -top-2 ${isOwnMessage ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 text-xs hidden sm:block`}
                            title="Reply"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8.354 1.646a.5.5 0 0 1 0 .708L5.707 5H14.5a.5.5 0 0 1 0 1H5.707l2.647 2.646a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z"/>
                            </svg>
                          </button>

                          {/* Show replied message context */}
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
                          <div className="flex items-center justify-between mt-1">
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
                              <div className={`${
                                isOwnMessage
                                  ? "text-indigo-100"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}>
                                {renderMessageStatus(messageStatus)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
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
                  {/* Reply Preview */}
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 sm:p-6">
                <div className="text-center">
                  <i className="fas fa-comments text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 opacity-50"></i>
                  <p className="text-base sm:text-lg md:text-xl">Select a chat to start messaging</p>
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
