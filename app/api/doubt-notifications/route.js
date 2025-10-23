import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";

import { 
  sendAvengersAssemblyNotification, 
  removeAssemblyNotificationIfResolved,
  manageAssemblyNotification
} from "@/lib/global-notifications";

// Debug logging function
const debugLog = (message, data = null) => {
  console.log(`[DOUBT NOTIFICATIONS API] ${message}`, data ? data : '');
};

export async function POST(request) {
  try {
    const { doubtId, action, userId, userRoll } = await request.json();

    if (action === "notify_solution") {
      // Create notification for user when solution is available
      const notificationData = {
        type: "doubt_solved",
        title: "Your doubt has been solved!",
        message: "A classmate has provided a solution to your doubt. Check it out!",
        doubtId: doubtId,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        read: false,
        link: `/all/doubts` // Link to the resolved doubt
      };

      const userNotificationRef = ref(db, `notifications/${userId}`);
      await push(userNotificationRef, notificationData);

      return Response.json({ success: true, message: "Notification sent" });
    }

    if (action === "notify_reviewers") {
      debugLog('🔔 Processing notify_reviewers action', { doubtId });
      
      // Create notification for all reviewers when new doubt is submitted
      const reviewerNotificationData = {
        type: "new_doubt",
        title: "New doubt submitted",
        message: "A coder/programmer has submitted a new coding doubt that needs review.",
        doubtId: doubtId,
        timestamp: Date.now(),
        read: false,
        link: `/reviewers/dashboard`
      };

      // Notify reviewers
      const notificationsRef = ref(db, "reviewerNotifications");
      await push(notificationsRef, reviewerNotificationData);
      debugLog('✅ Reviewer notification sent');

      // Get doubt data for personalized assembly notification
      debugLog('📖 Fetching doubt data for assembly notification...');
      const doubtRef = ref(db, `doubts/${doubtId}`);
      const doubtSnapshot = await new Promise((resolve) => {
        onValue(doubtRef, resolve, { onlyOnce: true });
      });
      const doubtData = doubtSnapshot.val();
      
      if (doubtData) {
        debugLog('📋 Doubt data retrieved', { 
          title: doubtData.title, 
          asker: doubtData.userDetails?.name 
        });
        
        // Send Avengers assembly notification to all users with doubt information
        try {
          debugLog('🦸‍♂️ Sending Avengers Assembly notification...');
          const assemblyResult = await sendAvengersAssemblyNotification(doubtData);
          debugLog('✅ Assembly notification result:', assemblyResult);
        } catch (assemblyError) {
          console.error('❌ Failed to send assembly notification:', assemblyError);
          // Don't fail the main request if assembly notification fails
        }
      } else {
        debugLog('❌ Doubt data not found for assembly notification');
      }

      return Response.json({ success: true, message: "Reviewers notified and Avengers assembled" });
    }

    if (action === "mark_satisfied") {
      // Verify that the user owns this doubt
      if (!userRoll) {
        return Response.json(
          { success: false, message: "User roll required for verification" },
          { status: 400 }
        );
      }

      // Mark doubt as satisfied by user and move to archive
      const doubtRef = ref(db, `doubts/${doubtId}`);
      const archiveRef = ref(db, `resolvedDoubts/${doubtId}`);
      
      // Get current doubt data
      const satisfiedDoubtSnapshot = await new Promise((resolve) => {
        onValue(doubtRef, resolve, { onlyOnce: true });
      });
      
      const satisfiedDoubtData = satisfiedDoubtSnapshot.val();
      
      // Verify ownership
      if (!satisfiedDoubtData || satisfiedDoubtData.userDetails?.roll !== userRoll) {
        return Response.json(
          { success: false, message: "Unauthorized: You can only mark your own doubts" },
          { status: 403 }
        );
      }
      
      
    }

    if (action === "mark_not_satisfied") {
      // Verify that the user owns this doubt
      if (!userRoll) {
        return Response.json(
          { success: false, message: "User roll required for verification" },
          { status: 400 }
        );
      }

      // Mark doubt as not satisfied and reopen it for more help
      const doubtRef = ref(db, `doubts/${doubtId}`);
      const archiveRef = ref(db, `resolvedDoubts/${doubtId}`);
      
      // Get current doubt data (might be in archive or main doubts)
      let notSatisfiedDoubtData = null;
      
      // First check if it's in archive
      const archiveSnapshot = await new Promise((resolve) => {
        onValue(archiveRef, resolve, { onlyOnce: true });
      });
      
      if (archiveSnapshot.val()) {
        notSatisfiedDoubtData = archiveSnapshot.val();
        
        // Verify ownership
        if (notSatisfiedDoubtData.userDetails?.roll !== userRoll) {
          return Response.json(
            { success: false, message: "Unauthorized: You can only mark your own doubts" },
            { status: 403 }
          );
        }
        
        // Remove from archive
        await remove(archiveRef);
      } else {
        // Check in main doubts
        const mainDoubtSnapshot = await new Promise((resolve) => {
          onValue(doubtRef, resolve, { onlyOnce: true });
        });
        notSatisfiedDoubtData = mainDoubtSnapshot.val();
        
        // Verify ownership
        if (!notSatisfiedDoubtData || notSatisfiedDoubtData.userDetails?.roll !== userRoll) {
          return Response.json(
            { success: false, message: "Unauthorized: You can only mark your own doubts" },
            { status: 403 }
          );
        }
      }
      
      if (notSatisfiedDoubtData && notSatisfiedDoubtData.solution) {
        // Award reduced points for the initial attempt
        const solverRoll = notSatisfiedDoubtData.solution.solvedBy.roll;
        const reducedPoints = calculateSolverPoints(
          notSatisfiedDoubtData.solution.content,
          notSatisfiedDoubtData.solution.attachments || [],
          notSatisfiedDoubtData.solution.assignedAt,
          notSatisfiedDoubtData.solution.solvedAt,
          false // Not satisfied
        );
        
        const pointsRef = ref(db, `solverPoints/${solverRoll}`);
        const pointsSnapshot = await new Promise((resolve) => {
          onValue(pointsRef, resolve, { onlyOnce: true });
        });
        
        const currentData = pointsSnapshot.val() || { totalPoints: 0, doubtsResolved: 0 };
        const newTotalPoints = (currentData.totalPoints || 0) + reducedPoints;
        
        await update(pointsRef, {
          totalPoints: newTotalPoints,
          doubtsResolved: currentData.doubtsResolved, // Don't increment since not fully resolved
          lastUpdated: Date.now(),
          solverName: notSatisfiedDoubtData.solution.solvedBy.name
        });
        
        // Reset doubt status and add feedback
        const reopenedData = {
          ...notSatisfiedDoubtData,
          status: "needs_clarification",
          userSatisfied: false,
          needsMoreHelp: true,
          reopenedAt: Date.now(),
          previousAttempts: (notSatisfiedDoubtData.previousAttempts || 0) + 1,
          solution: {
            ...notSatisfiedDoubtData.solution,
            finalPoints: reducedPoints,
            needsImprovement: true
          }
        };
        
        // Put back in main doubts for reviewers to see
        await update(doubtRef, reopenedData);
        
        // Notify reviewers about reopened doubt
        const reviewerNotificationData = {
          type: "doubt_reopened",
          title: "Doubt needs more help",
          message: "A coder/programmer needs additional assistance with their doubt solution.",
          doubtId: doubtId,
          timestamp: Date.now(),
          read: false,
          link: `/reviewers/dashboard`
        };
        
        const notificationsRef = ref(db, "reviewerNotifications");
        await push(notificationsRef, reviewerNotificationData);
        
        // Manage assembly notification for reopened doubt
        try {
          const result = await manageAssemblyNotification();
          console.log('Assembly notification managed for reopened doubt:', result.message);
        } catch (assemblyError) {
          console.error('Failed to manage assembly notification for reopened doubt:', assemblyError);
        }
        
        return Response.json({ 
          success: true, 
          message: "Doubt reopened for further assistance",
          pointsAwarded: reducedPoints 
        });
      } else {
        return Response.json({ success: false, message: "Doubt not found" }, { status: 404 });
      }
    }

    if (action === "check_assembly_removal") {
      // Check and manage assembly notification after solution submission
      try {
        const result = await manageAssemblyNotification();
        return Response.json({ 
          success: true, 
          message: result.message,
          action: result.action
        });
      } catch (assemblyError) {
        console.error('Failed to manage assembly notification:', assemblyError);
        return Response.json({ 
          success: false, 
          message: "Failed to manage assembly notification" 
        }, { status: 500 });
      }
    }

    return Response.json({ success: false, message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error handling doubt notification:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
