"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, update, get, onValue } from "firebase/database";
import { users } from "@/lib/mino.js";

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

// Helper function to get user name from roll number
const getUserName = (rollNumber) => {
  const user = users.find(u => u.roll === rollNumber);
  return user ? user.name : rollNumber; // Fallback to roll if name not found
};

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
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [selectedReactionFilter, setSelectedReactionFilter] = useState('all');
  const panelRef = useRef(null);
  const modalRef = useRef(null);

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
      
      // Close reactions modal when clicking outside
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowReactionsModal(false);
      }
    };

    const handleTouchOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowEmojiPanelState(false);
      }
      
      // Close reactions modal when clicking outside
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowReactionsModal(false);
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
      const rollNumber = userList[0];
      return rollNumber === currentUserRoll ? "You" : getUserName(rollNumber);
    } else if (count === 2) {
      const others = userList.filter(u => u !== currentUserRoll);
      if (userList.includes(currentUserRoll)) {
        return `You and ${getUserName(others[0])}`;
      } else {
        return `${getUserName(userList[0])} and ${getUserName(userList[1])}`;
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

  // Get total reactions count
  const getTotalReactionsCount = () => {
    const displayReactions = getDisplayReactions();
    return displayReactions.reduce((total, reaction) => total + reaction.count, 0);
  };

  // Get user details for reactions modal
  const getUsersForReaction = (emoji) => {
    if (!reactions[emoji]) return [];
    
    return Object.entries(reactions[emoji])
      .map(([userRoll, userData]) => ({
        roll: userRoll,
        name: getUserName(userRoll),
        timestamp: userData.timestamp || Date.now()
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
  };

  // Get all users who reacted (for "All" filter)
  const getAllReactedUsers = () => {
    const allUsers = {};
    
    Object.entries(reactions).forEach(([emoji, users]) => {
      Object.entries(users).forEach(([userRoll, userData]) => {
        if (!allUsers[userRoll]) {
          allUsers[userRoll] = {
            roll: userRoll,
            name: getUserName(userRoll),
            emoji: emoji,
            timestamp: userData.timestamp || Date.now()
          };
        }
      });
    });
    
    return Object.values(allUsers).sort((a, b) => b.timestamp - a.timestamp);
  };

  // Handle clicking on reactions summary (WhatsApp-style)
  const handleReactionsSummaryClick = () => {
    setShowReactionsModal(true);
    setSelectedReactionFilter('all');
  };

  // Handle clicking on specific reaction emoji in modal
  const handleReactionFilterClick = (emoji) => {
    setSelectedReactionFilter(emoji);
  };

  console.log('🎭 [Render] Component state:', {
    messageId,
    hasValidReactions,
    userCurrentReaction,
    reactionsCount: Object.keys(reactions).length,
    displayReactions: getDisplayReactions().length
  });

  return (
    <div className={`${className}`}>
      {/* Reaction Display - Positioned with proper spacing to avoid overlap */}
      {hasValidReactions && (
        <div className={`flex gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          {(() => {
            const displayReactions = getDisplayReactions();
            const totalCount = getTotalReactionsCount();
            const maxDisplay = 3; // Show max 3 reactions
            
            return displayReactions.slice(0, maxDisplay).map(({ emoji, users, count, hasUserReacted }) => (
              <div
                key={emoji}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 shadow-md hover:scale-105 hover:shadow-lg ${
                  hasUserReacted
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                } ${count === 1 ? 'min-w-[28px] justify-center' : ''}`}
                onClick={() => {
                  // Open modal with this reaction filter
                  setSelectedReactionFilter(emoji);
                  setShowReactionsModal(true);
                }}
                title={getReactionSummary(emoji, users)}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <span className="text-sm" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>{emoji}</span>
                {/* Only show count if more than 1 reaction */}
                {count > 1 && (
                  <span className={`font-semibold text-xs ${
                    hasUserReacted 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {count}
                  </span>
                )}
              </div>
            ));
          })()}
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

      {/* WhatsApp-Style Reactions Modal */}
      {showReactionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Message reactions
              </h3>
              <button
                onClick={() => setShowReactionsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Reaction Filter Tabs */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
              {/* All reactions tab */}
              <button
                onClick={() => handleReactionFilterClick('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                  selectedReactionFilter === 'all'
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-650'
                }`}
              >
                All {getTotalReactionsCount()}
              </button>

              {/* Individual reaction tabs */}
              {getDisplayReactions().map(({ emoji, count }) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionFilterClick(emoji)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                    selectedReactionFilter === emoji
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-650'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>

            {/* Users List */}
            <div className="overflow-y-auto max-h-80">
              {(() => {
                const usersToShow = selectedReactionFilter === 'all' 
                  ? getAllReactedUsers() 
                  : getUsersForReaction(selectedReactionFilter);
                
                if (usersToShow.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <span className="text-2xl mb-2 block">😊</span>
                      No reactions yet
                    </div>
                  );
                }

                return usersToShow.map((user, index) => (
                  <div
                    key={user.roll}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Click to view profile
                        </span>
                      </div>
                    </div>

                    {/* Reaction Emoji */}
                    {selectedReactionFilter === 'all' && user.emoji && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full">
                        <span className="text-lg">{user.emoji}</span>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
