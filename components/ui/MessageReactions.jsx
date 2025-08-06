"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, update, get, onValue } from "firebase/database";

// Popular emoji reactions like WhatsApp
const EMOJI_REACTIONS = [
  { emoji: "👍", name: "thumbs-up" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😂", name: "joy" },
  { emoji: "😢", name: "crying" },
  { emoji: "😮", name: "wow" },
  { emoji: "😡", name: "angry" },
  { emoji: "👏", name: "clap" },
  { emoji: "🔥", name: "fire" },
];

const MessageReactions = ({
  messageId,
  chatPath, // Firebase path string (e.g., 'p2pChats/chatId' or 'groupMessages/groupId')
  currentUserRoll,
  isOwnMessage = false,
  className = "",
  showEmojiPanel = false, // Allow parent to control panel visibility
  onShowEmojiPanelChange, // Callback to notify parent of panel state changes
}) => {
  const [internalShowEmojiPanel, setInternalShowEmojiPanel] = useState(false);
  const [reactions, setReactions] = useState({});
  const [userCurrentReaction, setUserCurrentReaction] = useState(null);
  const panelRef = useRef(null);

  // Use external control if provided, otherwise use internal state
  const isEmojiPanelOpen = onShowEmojiPanelChange ? showEmojiPanel : internalShowEmojiPanel;
  const setShowEmojiPanelState = onShowEmojiPanelChange ? onShowEmojiPanelChange : setInternalShowEmojiPanel;

  // Real-time listener for reactions
  useEffect(() => {
    if (!messageId || !chatPath) return;

    const reactionsRef = ref(db, `${chatPath}/messages/${messageId}/reactions`);
    
    console.log('🎭 [MessageReactions] Setting up real-time listener for:', `${chatPath}/messages/${messageId}/reactions`);

    const unsubscribe = onValue(reactionsRef, (snapshot) => {
      const reactionsData = snapshot.val() || {};
      console.log('🎭 [Real-time] Reactions updated:', reactionsData);
      
      setReactions(reactionsData);
      
      // Find current user's reaction
      let userReaction = null;
      Object.entries(reactionsData).forEach(([emoji, users]) => {
        if (users && users[currentUserRoll]) {
          userReaction = emoji;
        }
      });
      
      setUserCurrentReaction(userReaction);
      console.log('🎭 [Real-time] User current reaction:', userReaction);
    });

    return () => {
      console.log('🎭 [MessageReactions] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [messageId, chatPath, currentUserRoll]);

  // Close emoji panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowEmojiPanelState(false);
      }
    };

    const handleTouchOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowEmojiPanelState(false);
      }
    };

    // Add both mouse and touch event listeners for better mobile support
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [setShowEmojiPanelState]);

  // WhatsApp-style Reaction Logic: Replace/Update/Withdraw
  const handleReaction = async (emoji) => {
    console.log('🎯 [WHATSAPP-REACT] User clicked:', emoji, '| Current reaction:', userCurrentReaction);
    console.log('👤 [WHATSAPP-REACT] User:', currentUserRoll, '| Message:', messageId);
    
    // Add a small delay to prevent double-clicks on mobile
    if (window.reactionTimeout) {
      return;
    }
    
    window.reactionTimeout = setTimeout(() => {
      window.reactionTimeout = null;
    }, 300);
    
    // Determine the action based on current state
    let actionType = 'ADD';
    if (userCurrentReaction) {
      actionType = userCurrentReaction === emoji ? 'WITHDRAW' : 'REPLACE';
    }
    console.log('🔄 [WHATSAPP-REACT] Action:', actionType);
    console.log('🔍 [WHATSAPP-REACT] String comparison:', `"${userCurrentReaction}" === "${emoji}"`, '=', userCurrentReaction === emoji);
    console.log('🔍 [WHATSAPP-REACT] Type check:', typeof userCurrentReaction, typeof emoji);
    
    try {
      const messageRef = ref(db, `${chatPath}/messages/${messageId}/reactions`);
      
      // Get fresh data from Firebase to avoid race conditions
      const snapshot = await get(messageRef);
      const currentReactions = snapshot.val() || {};
      console.log('📊 [WHATSAPP-REACT] Current DB state:', currentReactions);

      // Create completely fresh reactions object 
      const updatedReactions = {};

      // STEP 1: Copy all reactions EXCEPT this user's reactions (enforce single emoji rule)
      Object.entries(currentReactions).forEach(([emojiKey, users]) => {
        if (users && typeof users === 'object') {
          const filteredUsers = {};
          
          // Copy all users except current user (removing any existing reactions from this user)
          Object.entries(users).forEach(([userRoll, userData]) => {
            if (userRoll !== currentUserRoll) {
              filteredUsers[userRoll] = userData;
            }
          });
          
          // Only keep emoji if other users have reacted
          if (Object.keys(filteredUsers).length > 0) {
            updatedReactions[emojiKey] = filteredUsers;
          }
        }
      });

      console.log('🧹 [WHATSAPP-REACT] After removing user reactions:', updatedReactions);

      // STEP 2: Apply WhatsApp behavior based on action type
      if (userCurrentReaction !== emoji) {
        // CASE 1: ADD (first time) or REPLACE (different emoji)
        console.log(`✅ [WHATSAPP-REACT] ${actionType}: ${userCurrentReaction || 'none'} → ${emoji}`);
        
        if (!updatedReactions[emoji]) {
          updatedReactions[emoji] = {};
        }
        
        updatedReactions[emoji][currentUserRoll] = {
          timestamp: Date.now(),
          name: currentUserRoll
        };
      } else {
        // CASE 2: WITHDRAW (same emoji clicked twice)
        console.log(`🗑️ [WHATSAPP-REACT] WITHDRAW: User clicked same emoji ${emoji} again`);
        console.log(`🗑️ [WHATSAPP-REACT] Current reaction: "${userCurrentReaction}", Clicked: "${emoji}"`);
        console.log('🗑️ [WHATSAPP-REACT] User reaction should be removed (already done in STEP 1)');
        // No need to add anything - reaction already removed in step 1
      }

      console.log('💾 [WHATSAPP-REACT] Final update:', updatedReactions);
      console.log('🎯 [WHATSAPP-REACT] Action completed:', actionType);
      
      // Atomic update to Firebase
      await update(messageRef, updatedReactions);
      console.log('✅ [WHATSAPP-REACT] Successfully applied WhatsApp-style reaction behavior!');
      
      setShowEmojiPanelState(false);
    } catch (error) {
      console.error("❌ [WHATSAPP-REACT] Error:", error);
    }
  };

  // Get reaction summary for tooltip
  const getReactionSummary = (emoji, users) => {
    const userList = Object.keys(users);
    const count = userList.length;
    
    if (count === 1) {
      return userList[0] === currentUserRoll ? "You" : userList[0];
    } else if (count === 2) {
      const others = userList.filter(u => u !== currentUserRoll);
      if (userList.includes(currentUserRoll)) {
        return `You and ${others[0]}`;
      } else {
        return `${userList[0]} and ${userList[1]}`;
      }
    } else {
      const hasCurrentUser = userList.includes(currentUserRoll);
      if (hasCurrentUser) {
        return `You and ${count - 1} others`;
      } else {
        return `${count} people`;
      }
    }
  };

  // Check if there are any valid reactions to display
  const hasValidReactions = reactions && 
    typeof reactions === 'object' && 
    Object.keys(reactions).length > 0 &&
    Object.values(reactions).some(users => 
      users && typeof users === 'object' && Object.keys(users).length > 0
    );

  // Get processed reactions for display
  const getDisplayReactions = () => {
    if (!hasValidReactions) return [];
    
    return Object.entries(reactions)
      .map(([emoji, users]) => {
        if (!users || typeof users !== 'object' || Object.keys(users).length === 0) {
          return null;
        }
        
        return {
          emoji,
          users,
          count: Object.keys(users).length,
          hasUserReacted: !!users[currentUserRoll]
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  console.log('🎭 [Render] Component state:', {
    messageId,
    hasValidReactions,
    userCurrentReaction,
    reactionsCount: Object.keys(reactions).length,
    displayReactions: getDisplayReactions().length
  });

  return (
    <div className={`relative ${className}`}>
      {/* Reaction Display - Show under message timestamp */}
      {hasValidReactions && (
        <div className={`flex flex-wrap gap-1 mt-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          {getDisplayReactions().map(({ emoji, users, count, hasUserReacted }) => (
            <div
              key={emoji}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 shadow-sm hover:scale-105 ${
                hasUserReacted
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => handleReaction(emoji)}
              title={getReactionSummary(emoji, users)}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <span className="text-sm" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>{emoji}</span>
              <span className={`font-medium text-xs ${
                hasUserReacted 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction Button */}
      <div className="inline-block">
        <button
          onClick={() => setShowEmojiPanelState(!isEmojiPanelOpen)}
          className={`absolute ${isOwnMessage ? '-left-8' : '-right-8'} -top-8 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-110 ${
            isOwnMessage ? 'text-indigo-200 hover:text-indigo-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          title="Add reaction"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Emoji Panel */}
        {isEmojiPanelOpen && (
          <div
            ref={panelRef}
            data-emoji-panel="true"
            className={`absolute z-[70] ${
              isOwnMessage ? 'right-0' : 'left-0'
            } -top-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-2 sm:p-3 animate-in slide-in-from-top-2 duration-200`}
            style={{ 
              minWidth: '180px',
              maxWidth: '95vw',
              width: 'max-content'
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center max-w-full">
              {EMOJI_REACTIONS.map((reaction) => {
                const isUserReaction = userCurrentReaction === reaction.emoji;
                const reactionCount = reactions[reaction.emoji] ? Object.keys(reactions[reaction.emoji]).length : 0;
                
                // Determine if this emoji should be disabled
                const isDisabled = userCurrentReaction && !isUserReaction; // User has a reaction but not this one
                
                return (
                  <div key={reaction.name} className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReaction(reaction.emoji);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle touch end for Android devices
                        handleReaction(reaction.emoji);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      disabled={isDisabled}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-200 relative touch-manipulation ${
                        isUserReaction
                          ? 'bg-blue-100 dark:bg-blue-900/40 scale-110 ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg hover:scale-110'
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed scale-90'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:scale-110 active:scale-95'
                      }`}
                      style={{ 
                        userSelect: 'none', 
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      title={
                        isDisabled 
                          ? `${reaction.name} - Disabled (you already reacted with ${userCurrentReaction})`
                          : `${reaction.name}${isUserReaction ? ' (your current reaction - click to remove)' : ''}${reactionCount > 0 ? ` - ${reactionCount} reaction${reactionCount > 1 ? 's' : ''}` : ''}`
                      }
                    >
                      <span className={`text-lg sm:text-xl ${isDisabled ? 'filter grayscale' : ''}`}
                            style={{ 
                              userSelect: 'none', 
                              WebkitUserSelect: 'none',
                              WebkitTouchCallout: 'none'
                            }}>
                        {reaction.emoji}
                      </span>
                      
                      {/* Visual indicator for user's current reaction */}
                      {isUserReaction && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Disabled overlay for non-selected emojis when user has reacted */}
                      {isDisabled && (
                        <div className="absolute inset-0 bg-gray-400 dark:bg-gray-600 bg-opacity-20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Reaction count badge (only for non-disabled, non-user reactions) */}
                      {reactionCount > 0 && !isUserReaction && !isDisabled && (
                        <div className="absolute -top-1 -right-1 min-w-[0.875rem] h-3.5 sm:min-w-[1rem] sm:h-4 bg-gray-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center px-1">
                          {reactionCount}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* WhatsApp-style behavior hint with clear single selection messaging */}
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center mt-2 sm:mt-3 px-1 sm:px-2 leading-tight"
                 style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              {userCurrentReaction 
                ? `✅ Selected: ${userCurrentReaction} • Click it to remove, others are disabled` 
                : "🎯 Choose ONE emoji • Others will be disabled after selection"
              }
            </div>
            
            {/* Arrow pointer */}
            <div
              className={`absolute top-full ${
                isOwnMessage ? 'right-3 sm:right-4' : 'left-3 sm:left-4'
              } w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800`}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
