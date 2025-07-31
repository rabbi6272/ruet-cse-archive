// Migration script to precompute Nutrinos for existing users
// This script calculates and awards retroactive Nutrinos based on historical activities

import { db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";
import { 
  NUTRINOS_CONFIG, 
  addNutrinos, 
  initializeUserNutrinos,
  calculateUserRank,
  calculateUserLevel 
} from "@/lib/nutrinos-system";

/**
 * Migration script to precompute Nutrinos for existing users
 */
export const migrateExistingUsersNutrinos = async () => {
  console.log("🚀 Starting Nutrinos migration for existing users...");
  
  try {
    // Step 1: Get all existing code snippets
    const snippetsRef = ref(db, "codeSnippets");
    const snippetsSnapshot = await get(snippetsRef);
    const allSnippets = snippetsSnapshot.val() || {};
    
    // Step 2: Get all existing doubts
    const doubtsRef = ref(db, "doubts");
    const doubtsSnapshot = await get(doubtsRef);
    const allDoubts = doubtsSnapshot.val() || {};
    
    // Step 3: Get all existing comments (if they exist)
    const commentsRef = ref(db, "comments");
    const commentsSnapshot = await get(commentsRef);
    const allComments = commentsSnapshot.val() || {};
    
    // Step 4: Track user activities
    const userActivities = {};
    
    // Process code snippets
    console.log("📝 Processing code snippets...");
    Object.entries(allSnippets).forEach(([snippetId, snippet]) => {
      const userRoll = snippet.rollNumber || snippet.roll;
      if (!userRoll) return;
      
      if (!userActivities[userRoll]) {
        userActivities[userRoll] = {
          snippets: 0,
          doubtsAsked: 0,
          doubtsSolved: 0,
          comments: 0,
          replies: 0,
          activities: []
        };
      }
      
      userActivities[userRoll].snippets++;
      userActivities[userRoll].activities.push({
        type: 'snippet',
        points: NUTRINOS_CONFIG.ADD_SNIPPET,
        reason: `Added code snippet: ${snippet.title || 'Untitled'}`,
        date: snippet.date || snippet.createdAt || new Date().toISOString(),
        metadata: { snippetId, title: snippet.title }
      });
    });
    
    // Process doubts
    console.log("❓ Processing doubts...");
    Object.entries(allDoubts).forEach(([doubtId, doubt]) => {
      const askerRoll = doubt.rollNumber || doubt.roll;
      const solverRoll = doubt.solvedBy || doubt.reviewerRoll;
      
      // Award points to doubt asker
      if (askerRoll) {
        if (!userActivities[askerRoll]) {
          userActivities[askerRoll] = {
            snippets: 0,
            doubtsAsked: 0,
            doubtsSolved: 0,
            comments: 0,
            replies: 0,
            activities: []
          };
        }
        
        userActivities[askerRoll].doubtsAsked++;
        userActivities[askerRoll].activities.push({
          type: 'doubt_ask',
          points: NUTRINOS_CONFIG.ASK_DOUBT,
          reason: `Asked doubt: ${doubt.title || 'Untitled'}`,
          date: doubt.timestamp || doubt.createdAt || new Date().toISOString(),
          metadata: { doubtId, title: doubt.title }
        });
      }
      
      // Award points to doubt solver
      if (solverRoll && doubt.status === 'solved') {
        if (!userActivities[solverRoll]) {
          userActivities[solverRoll] = {
            snippets: 0,
            doubtsAsked: 0,
            doubtsSolved: 0,
            comments: 0,
            replies: 0,
            activities: []
          };
        }
        
        userActivities[solverRoll].doubtsSolved++;
        userActivities[solverRoll].activities.push({
          type: 'doubt_solve',
          points: NUTRINOS_CONFIG.SOLVE_DOUBT,
          reason: `Solved doubt: ${doubt.title || 'Untitled'}`,
          date: doubt.solvedAt || doubt.updatedAt || new Date().toISOString(),
          metadata: { doubtId, title: doubt.title, asker: askerRoll }
        });
      }
    });
    
    // Process comments (if they exist in your system)
    console.log("💬 Processing comments...");
    Object.entries(allComments).forEach(([commentId, comment]) => {
      const commenterRoll = comment.userRoll || comment.roll;
      const postOwnerRoll = comment.postOwnerRoll || comment.snippetOwner;
      
      if (commenterRoll) {
        if (!userActivities[commenterRoll]) {
          userActivities[commenterRoll] = {
            snippets: 0,
            doubtsAsked: 0,
            doubtsSolved: 0,
            comments: 0,
            replies: 0,
            activities: []
          };
        }
        
        userActivities[commenterRoll].comments++;
        userActivities[commenterRoll].activities.push({
          type: 'comment',
          points: NUTRINOS_CONFIG.MAKE_COMMENT,
          reason: `Made comment on post`,
          date: comment.timestamp || comment.createdAt || new Date().toISOString(),
          metadata: { commentId, postOwner: postOwnerRoll }
        });
      }
      
      // Award points to post owner for receiving comment
      if (postOwnerRoll && postOwnerRoll !== commenterRoll) {
        if (!userActivities[postOwnerRoll]) {
          userActivities[postOwnerRoll] = {
            snippets: 0,
            doubtsAsked: 0,
            doubtsSolved: 0,
            comments: 0,
            replies: 0,
            activities: []
          };
        }
        
        userActivities[postOwnerRoll].activities.push({
          type: 'comment_received',
          points: NUTRINOS_CONFIG.RECEIVE_COMMENT,
          reason: `Received comment on post`,
          date: comment.timestamp || comment.createdAt || new Date().toISOString(),
          metadata: { commentId, commenter: commenterRoll }
        });
      }
    });
    
    // Step 5: Apply Nutrinos to users
    console.log("⚡ Applying Nutrinos to users...");
    let totalUsersProcessed = 0;
    
    for (const [userRoll, activities] of Object.entries(userActivities)) {
      console.log(`Processing user: ${userRoll}`);
      
      // Initialize user Nutrinos
      await initializeUserNutrinos(userRoll);
      
      // Calculate total points
      let totalNutrinos = 0;
      const nutrinosHistory = [];
      
      // Sort activities by date
      activities.activities.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Apply each activity
      for (const activity of activities.activities) {
        totalNutrinos += activity.points;
        
        nutrinosHistory.push({
          id: `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nutrinos: activity.points,
          reason: activity.reason,
          timestamp: activity.date,
          metadata: { ...activity.metadata, migrated: true },
          runningTotal: totalNutrinos
        });
      }
      
      // Calculate rank and level
      const rank = calculateUserRank(totalNutrinos);
      const level = calculateUserLevel(totalNutrinos);
      
      // Update user's Nutrinos data
      const userNutrinosRef = ref(db, `userNutrinos/${userRoll}`);
      await update(userNutrinosRef, {
        totalNutrinos: totalNutrinos,
        nutrinosHistory: nutrinosHistory,
        rank: rank,
        level: level,
        lastUpdated: new Date().toISOString(),
        migrated: true,
        migrationDate: new Date().toISOString(),
        migrationSummary: {
          snippets: activities.snippets,
          doubtsAsked: activities.doubtsAsked,
          doubtsSolved: activities.doubtsSolved,
          comments: activities.comments,
          totalActivities: activities.activities.length
        }
      });
      
      totalUsersProcessed++;
      
      console.log(`✅ User ${userRoll}: ${totalNutrinos} Nutrinos, Rank: ${rank}, Level: ${level}`);
    }
    
    // Step 6: Create migration log
    const migrationLogRef = ref(db, "migrations/nutrinosMigration");
    await set(migrationLogRef, {
      completed: true,
      completedAt: new Date().toISOString(),
      totalUsersProcessed: totalUsersProcessed,
      totalSnippetsProcessed: Object.keys(allSnippets).length,
      totalDoubtsProcessed: Object.keys(allDoubts).length,
      totalCommentsProcessed: Object.keys(allComments).length,
      summary: Object.entries(userActivities).map(([roll, data]) => ({
        roll,
        totalActivities: data.activities.length,
        totalPoints: data.activities.reduce((sum, act) => sum + act.points, 0)
      }))
    });
    
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${totalUsersProcessed}`);
    console.log(`   - Snippets processed: ${Object.keys(allSnippets).length}`);
    console.log(`   - Doubts processed: ${Object.keys(allDoubts).length}`);
    console.log(`   - Comments processed: ${Object.keys(allComments).length}`);
    
    return {
      success: true,
      totalUsersProcessed,
      summary: userActivities
    };
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    
    // Log the error
    const errorLogRef = ref(db, "migrations/nutrinosMigrationError");
    await set(errorLogRef, {
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    
    throw error;
  }
};

/**
 * Check if migration has already been run
 */
export const checkMigrationStatus = async () => {
  try {
    const migrationRef = ref(db, "migrations/nutrinosMigration");
    const snapshot = await get(migrationRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error checking migration status:", error);
    return null;
  }
};

/**
 * Dry run to see what the migration would do without actually applying changes
 */
export const dryRunMigration = async () => {
  console.log("🔍 Running dry migration to preview changes...");
  
  try {
    // Get all existing code snippets
    const snippetsRef = ref(db, "codeSnippets");
    const snippetsSnapshot = await get(snippetsRef);
    const allSnippets = snippetsSnapshot.val() || {};
    
    // Get all existing doubts
    const doubtsRef = ref(db, "doubts");
    const doubtsSnapshot = await get(doubtsRef);
    const allDoubts = doubtsSnapshot.val() || {};
    
    const userPreview = {};
    
    // Process snippets
    Object.entries(allSnippets).forEach(([snippetId, snippet]) => {
      const userRoll = snippet.rollNumber || snippet.roll;
      if (!userRoll) return;
      
      if (!userPreview[userRoll]) {
        userPreview[userRoll] = { snippets: 0, doubtsAsked: 0, doubtsSolved: 0, totalPoints: 0 };
      }
      
      userPreview[userRoll].snippets++;
      userPreview[userRoll].totalPoints += NUTRINOS_CONFIG.ADD_SNIPPET;
    });
    
    // Process doubts
    Object.entries(allDoubts).forEach(([doubtId, doubt]) => {
      const askerRoll = doubt.rollNumber || doubt.roll;
      const solverRoll = doubt.solvedBy || doubt.reviewerRoll;
      
      if (askerRoll) {
        if (!userPreview[askerRoll]) {
          userPreview[askerRoll] = { snippets: 0, doubtsAsked: 0, doubtsSolved: 0, totalPoints: 0 };
        }
        userPreview[askerRoll].doubtsAsked++;
        userPreview[askerRoll].totalPoints += NUTRINOS_CONFIG.ASK_DOUBT;
      }
      
      if (solverRoll && doubt.status === 'solved') {
        if (!userPreview[solverRoll]) {
          userPreview[solverRoll] = { snippets: 0, doubtsAsked: 0, doubtsSolved: 0, totalPoints: 0 };
        }
        userPreview[solverRoll].doubtsSolved++;
        userPreview[solverRoll].totalPoints += NUTRINOS_CONFIG.SOLVE_DOUBT;
      }
    });
    
    console.log("📊 Migration Preview:");
    console.log(`Total users to be processed: ${Object.keys(userPreview).length}`);
    
    Object.entries(userPreview)
      .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .forEach(([roll, data]) => {
        const rank = calculateUserRank(data.totalPoints);
        const level = calculateUserLevel(data.totalPoints);
        console.log(`${roll}: ${data.totalPoints} Nutrinos (${data.snippets} snippets, ${data.doubtsAsked} doubts asked, ${data.doubtsSolved} doubts solved) - ${rank}, Level ${level}`);
      });
    
    return userPreview;
    
  } catch (error) {
    console.error("Dry run failed:", error);
    throw error;
  }
};

const nutrinosMigration = {
  migrateExistingUsersNutrinos,
  checkMigrationStatus,
  dryRunMigration
};

export default nutrinosMigration;
