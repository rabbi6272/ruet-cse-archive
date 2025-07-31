// Nutrinos Points System for RUET CSE Archive
// Complete gamification system with points for all user actions

import { db } from "@/lib/firebase";
import { ref, get, set, update, increment } from "firebase/database";
import { getStudentName } from "./students-loader";

// Nutrinos Points Configuration - Our platform currency
export const NUTRINOS_CONFIG = {
  // Code snippet related
  ADD_SNIPPET: 10,
  EDIT_SNIPPET: 1.5,
  DELETE_SNIPPET: -3,
  
  // Comment related
  RECEIVE_COMMENT: 1.5,    // Post owner gets this
  MAKE_COMMENT: 2.5,       // Commenter gets this
  EDIT_COMMENT: 0.5,       // Comment editor gets this
  DELETE_COMMENT: -2.5,    // Comment deleter loses this
  
  // Reply related
  RECEIVE_REPLY: 0.25,     // Post owner gets this per reply
  MAKE_REPLY: 1.5,         // Replier gets this
  EDIT_REPLY: 0.5,         // Reply editor gets this
  DELETE_REPLY: -2.5,      // Reply deleter loses this
  
  // Doubt system
  ASK_DOUBT: 5,            // Doubt asker gets this
  SOLVE_DOUBT: 10,         // Doubt solver gets this
  
  // Engagement
  GET_MENTIONED: 3,        // When someone mentions you
  DAILY_VISIT: 0.15,       // Daily website visit
};

/**
 * Initialize user Nutrinos if they don't exist
 * @param {string} userRoll - User's roll number
 * @param {string} userName - User's name (optional)
 */
export const initializeUserNutrinos = async (userRoll, userName = null) => {
  try {
    const nutrinosRef = ref(db, `userNutrinos/${userRoll}`);
    const snapshot = await get(nutrinosRef);
    
    if (!snapshot.exists()) {
      // Get user name from localStorage if not provided
      let finalUserName = userName;
      if (!finalUserName && typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            const user = JSON.parse(userData);
            finalUserName = user.name;
          }
        } catch (error) {
          console.warn("Could not get user name from localStorage:", error);
        }
      }
      
      // If still no name, try to get from students database
      if (!finalUserName) {
        finalUserName = getStudentName(userRoll);
      }
      
      await set(nutrinosRef, {
        totalNutrinos: 0,
        nutrinosHistory: [],
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        rank: 'Explorer',
        level: 1,
        name: finalUserName || `User ${userRoll}`
      });
    }
  } catch (error) {
    console.error("Error initializing user Nutrinos:", error);
  }
};

/**
 * Calculate user rank based on Nutrinos
 * @param {number} totalNutrinos - Total Nutrinos earned
 * @returns {string} - User rank
 */
export const calculateUserRank = (totalNutrinos) => {
  if (totalNutrinos >= 1000) return 'Code Architect';
  if (totalNutrinos >= 750) return 'Tech Innovator';
  if (totalNutrinos >= 500) return 'Code Master';
  if (totalNutrinos >= 250) return 'Developer';
  if (totalNutrinos >= 100) return 'Contributor';
  return 'Explorer';
};

/**
 * Calculate user level based on Nutrinos
 * @param {number} totalNutrinos - Total Nutrinos earned
 * @returns {number} - User level
 */
export const calculateUserLevel = (totalNutrinos) => {
  return Math.floor(totalNutrinos / 50) + 1;
};

/**
 * Map action types to Nutrinos points
 * @param {string} actionType - Type of action performed
 * @returns {number} - Points to award/deduct
 */
export const getPointsForAction = (actionType) => {
  const actionMap = {
    // Snippet actions
    'snippet_add': NUTRINOS_CONFIG.ADD_SNIPPET,
    'snippet_edit': NUTRINOS_CONFIG.EDIT_SNIPPET,
    'snippet_delete': NUTRINOS_CONFIG.DELETE_SNIPPET,
    
    // Comment actions
    'comment_made': NUTRINOS_CONFIG.MAKE_COMMENT,
    'comment_received': NUTRINOS_CONFIG.RECEIVE_COMMENT,
    'comment_edit': NUTRINOS_CONFIG.EDIT_COMMENT,
    'comment_delete': NUTRINOS_CONFIG.DELETE_COMMENT,
    
    // Reply actions
    'reply_made': NUTRINOS_CONFIG.MAKE_REPLY,
    'reply_received': NUTRINOS_CONFIG.RECEIVE_REPLY,
    'reply_edit': NUTRINOS_CONFIG.EDIT_REPLY,
    'reply_delete': NUTRINOS_CONFIG.DELETE_REPLY,
    
    // Doubt actions
    'doubt_ask': NUTRINOS_CONFIG.ASK_DOUBT,
    'doubt_solve': NUTRINOS_CONFIG.SOLVE_DOUBT,
    
    // Engagement actions
    'mention_received': NUTRINOS_CONFIG.GET_MENTIONED,
    'daily_visit': NUTRINOS_CONFIG.DAILY_VISIT,
  };
  
  return actionMap[actionType] || 0;
};

/**
 * Add Nutrinos to a user's account
 * @param {string} userRoll - User's roll number
 * @param {number|string} pointsOrAction - Either points directly or action type
 * @param {string} reason - Reason for Nutrinos change
 * @param {Object} metadata - Additional metadata
 */
export const addNutrinos = async (userRoll, pointsOrAction, reason, metadata = {}) => {
  try {
    // If pointsOrAction is a string, treat it as action type and get points
    const nutrinos = typeof pointsOrAction === 'string' 
      ? getPointsForAction(pointsOrAction)
      : pointsOrAction;
    
    // If it's an action type, use it as reason if no reason provided
    const finalReason = typeof pointsOrAction === 'string' && !reason 
      ? pointsOrAction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : reason || 'Points adjustment';

    const nutrinosRef = ref(db, `userNutrinos/${userRoll}`);
    const snapshot = await get(nutrinosRef);
    
    // Initialize if user doesn't exist
    if (!snapshot.exists()) {
      await initializeUserNutrinos(userRoll);
    }
    
    const currentData = snapshot.val() || { totalNutrinos: 0, nutrinosHistory: [] };
    const newTotal = Math.max(0, (currentData.totalNutrinos || 0) + nutrinos); // Prevent negative total
    
    // Calculate new rank and level
    const newRank = calculateUserRank(newTotal);
    const newLevel = calculateUserLevel(newTotal);
    
    // Create history entry
    const historyEntry = {
      id: Date.now().toString(),
      nutrinos: nutrinos,
      reason: finalReason,
      timestamp: new Date().toISOString(),
      metadata: metadata,
      runningTotal: newTotal
    };
    
    // Get user name from metadata, localStorage, or students database
    let userName = metadata.userName;
    if (!userName && typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userName = user.name;
        }
      } catch (error) {
        console.warn("Could not get user name from localStorage:", error);
      }
    }
    
    // If still no name, try to get from students database
    if (!userName) {
      userName = getStudentName(userRoll);
    }
    
    // Update user Nutrinos with name
    await update(nutrinosRef, {
      totalNutrinos: newTotal,
      nutrinosHistory: [...(currentData.nutrinosHistory || []), historyEntry],
      lastUpdated: new Date().toISOString(),
      rank: newRank,
      level: newLevel,
      name: userName || currentData.name || `User ${userRoll}` // Store user name for statistics
    });
    
    console.log(`Added ${nutrinos} Nutrinos to ${userRoll} for: ${finalReason}`);
    return { newTotal, newRank, newLevel };
  } catch (error) {
    console.error("Error adding Nutrinos:", error);
    throw error;
  }
};

/**
 * Get user's current Nutrinos
 * @param {string} userRoll - User's roll number
 * @returns {Object} - User Nutrinos data
 */
export const getUserNutrinos = async (userRoll) => {
  try {
    const nutrinosRef = ref(db, `userNutrinos/${userRoll}`);
    const snapshot = await get(nutrinosRef);
    const data = snapshot.val();
    
    if (!data) {
      await initializeUserNutrinos(userRoll);
      return { totalNutrinos: 0, rank: 'Explorer', level: 1 };
    }
    
    return {
      totalNutrinos: data.totalNutrinos || 0,
      rank: data.rank || 'Explorer',
      level: data.level || 1,
      lastUpdated: data.lastUpdated
    };
  } catch (error) {
    console.error("Error getting user Nutrinos:", error);
    return { totalNutrinos: 0, rank: 'Explorer', level: 1 };
  }
};

/**
 * Record daily visit Nutrinos
 * @param {string} userRoll - User's roll number
 */
export const recordDailyVisit = async (userRoll) => {
  try {
    const nutrinosRef = ref(db, `userNutrinos/${userRoll}`);
    const snapshot = await get(nutrinosRef);
    const userData = snapshot.val();
    
    if (userData) {
      const lastVisit = userData.lastVisit;
      const today = new Date().toDateString();
      const lastVisitDate = lastVisit ? new Date(lastVisit).toDateString() : null;
      
      // Only award Nutrinos if it's a new day
      if (lastVisitDate !== today) {
        await addNutrinos(userRoll, NUTRINOS_CONFIG.DAILY_VISIT, "Daily website visit");
        await update(nutrinosRef, { lastVisit: new Date().toISOString() });
      }
    } else {
      // First time visitor
      await initializeUserNutrinos(userRoll);
      await addNutrinos(userRoll, NUTRINOS_CONFIG.DAILY_VISIT, "First website visit");
    }
  } catch (error) {
    console.error("Error recording daily visit:", error);
  }
};

/**
 * Award Nutrinos for code snippet actions
 */
export const awardSnippetNutrinos = {
  add: async (userRoll, snippetId) => {
    return await addNutrinos(userRoll, NUTRINOS_CONFIG.ADD_SNIPPET, "Added code snippet", { snippetId });
  },
  
  edit: async (userRoll, snippetId) => {
    return await addNutrinos(userRoll, NUTRINOS_CONFIG.EDIT_SNIPPET, "Edited code snippet", { snippetId });
  },
  
  delete: async (userRoll, snippetId) => {
    return await addNutrinos(userRoll, NUTRINOS_CONFIG.DELETE_SNIPPET, "Deleted code snippet", { snippetId });
  }
};

/**
 * Award Nutrinos for comment actions
 */
export const awardCommentNutrinos = {
  receive: async (postOwnerRoll, commentId, commenterRoll) => {
    return await addNutrinos(postOwnerRoll, NUTRINOS_CONFIG.RECEIVE_COMMENT, "Received comment on post", { commentId, from: commenterRoll });
  },
  
  make: async (commenterRoll, commentId, postOwnerRoll) => {
    return await addNutrinos(commenterRoll, NUTRINOS_CONFIG.MAKE_COMMENT, "Made comment on post", { commentId, to: postOwnerRoll });
  }
};

/**
 * Award Nutrinos for reply actions
 */
export const awardReplyNutrinos = {
  receive: async (postOwnerRoll, replyId, replierRoll) => {
    return await addNutrinos(postOwnerRoll, NUTRINOS_CONFIG.RECEIVE_REPLY, "Received reply on post", { replyId, from: replierRoll });
  },
  
  make: async (replierRoll, replyId, postOwnerRoll) => {
    return await addNutrinos(replierRoll, NUTRINOS_CONFIG.MAKE_REPLY, "Made reply on post", { replyId, to: postOwnerRoll });
  }
};

/**
 * Award Nutrinos for doubt system
 */
export const awardDoubtNutrinos = {
  ask: async (askerRoll, doubtId) => {
    return await addNutrinos(askerRoll, NUTRINOS_CONFIG.ASK_DOUBT, "Asked a doubt", { doubtId });
  },
  
  solve: async (solverRoll, doubtId, askerRoll) => {
    return await addNutrinos(solverRoll, NUTRINOS_CONFIG.SOLVE_DOUBT, "Solved a doubt", { doubtId, asker: askerRoll });
  }
};

/**
 * Award Nutrinos for mentions
 */
export const awardMentionNutrinos = async (mentionedUserRoll, mentionerRoll, context) => {
  return await addNutrinos(mentionedUserRoll, NUTRINOS_CONFIG.GET_MENTIONED, "Got mentioned", { mentioner: mentionerRoll, context });
};

/**
 * Get top users by Nutrinos (leaderboard)
 * @param {number} limit - Number of top users to return
 * @returns {Array} - Array of top users with their Nutrinos
 */
export const getTopUsersByNutrinos = async (limit = 10) => {
  try {
    const nutrinosRef = ref(db, 'userNutrinos');
    const snapshot = await get(nutrinosRef);
    const allUserNutrinos = snapshot.val() || {};
    
    // Convert to array and sort by total Nutrinos
    const usersArray = Object.entries(allUserNutrinos)
      .map(([roll, data]) => ({
        roll,
        totalNutrinos: data.totalNutrinos || 0,
        rank: data.rank || 'Newbie',
        level: data.level || 1,
        lastUpdated: data.lastUpdated
      }))
      .sort((a, b) => b.totalNutrinos - a.totalNutrinos)
      .slice(0, limit);
    
    return usersArray;
  } catch (error) {
    console.error("Error getting top users:", error);
    return [];
  }
};

/**
 * Get user's Nutrinos history
 * @param {string} userRoll - User's roll number
 * @param {number} limit - Number of recent entries to return
 * @returns {Array} - Nutrinos history array
 */
export const getUserNutrinosHistory = async (userRoll, limit = 10) => {
  try {
    const nutrinosRef = ref(db, `userNutrinos/${userRoll}/nutrinosHistory`);
    const snapshot = await get(nutrinosRef);
    const history = snapshot.val() || [];
    
    // Convert object to array if needed and sort by timestamp
    const historyArray = Array.isArray(history) ? history : Object.values(history);
    return historyArray
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting Nutrinos history:", error);
    return [];
  }
};

const nutrinosSystem = {
  NUTRINOS_CONFIG,
  initializeUserNutrinos,
  addNutrinos,
  getUserNutrinos,
  recordDailyVisit,
  awardSnippetNutrinos,
  awardCommentNutrinos,
  awardReplyNutrinos,
  awardDoubtNutrinos,
  awardMentionNutrinos,
  getTopUsersByNutrinos,
  getUserNutrinosHistory,
  calculateUserRank,
  calculateUserLevel
};

export default nutrinosSystem;
