import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { calculateSolverPoints } from "@/lib/points-system";
import { isAuthorizedReviewer } from "@/lib/auth-utils";

export async function POST(request) {
  try {
    const { doubtId, action, userId, userRoll } = await request.json();

    // Check authorization for reviewer-only actions
    const reviewerOnlyActions = ["notify_solution"];
    if (reviewerOnlyActions.includes(action)) {
      if (!userRoll || !isAuthorizedReviewer({ roll: userRoll })) {
        return Response.json(
          { success: false, message: "Unauthorized: Only code reviewers can perform this action" },
          { status: 403 }
        );
      }
    }

    if (action === "notify_solution") {
      // Create notification for user when solution is available
      const notificationData = {
        type: "doubt_solved",
        title: "Your doubt has been solved!",
        message: "A code reviewer has provided a solution to your doubt. Check it out!",
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

      // You can expand this to notify specific reviewers
      const notificationsRef = ref(db, "reviewerNotifications");
      await push(notificationsRef, reviewerNotificationData);

      return Response.json({ success: true, message: "Reviewers notified" });
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
      
      if (satisfiedDoubtData && satisfiedDoubtData.solution) {
        // Calculate final points with satisfaction bonus
        const finalPoints = calculateSolverPoints(
          satisfiedDoubtData.solution.content,
          satisfiedDoubtData.solution.attachments || [],
          satisfiedDoubtData.solution.assignedAt,
          satisfiedDoubtData.solution.solvedAt,
          true // User is satisfied
        );
        
        // Update solver's total points
        const solverRoll = satisfiedDoubtData.solution.solvedBy.roll;
        const pointsRef = ref(db, `solverPoints/${solverRoll}`);
        
        // Get current points
        const pointsSnapshot = await new Promise((resolve) => {
          onValue(pointsRef, resolve, { onlyOnce: true });
        });
        
        const currentData = pointsSnapshot.val() || { totalPoints: 0, doubtsResolved: 0 };
        const newTotalPoints = (currentData.totalPoints || 0) + finalPoints;
        const newDoubtsResolved = (currentData.doubtsResolved || 0) + 1;
        
        // Update solver's points
        await update(pointsRef, {
          totalPoints: newTotalPoints,
          doubtsResolved: newDoubtsResolved,
          lastUpdated: Date.now(),
          solverName: satisfiedDoubtData.solution.solvedBy.name
        });
        
        // Add satisfaction confirmation and final points
        const finalData = {
          ...satisfiedDoubtData,
          userSatisfied: true,
          satisfiedAt: Date.now(),
          status: "completed",
          solution: {
            ...satisfiedDoubtData.solution,
            finalPoints: finalPoints
          }
        };
        
        // Move to archive
        await update(archiveRef, finalData);
        
        // Remove from pending/active doubts
        await remove(doubtRef);
        
        return Response.json({ 
          success: true, 
          message: "Doubt marked as satisfied and archived",
          pointsAwarded: finalPoints 
        });
      } else {
        return Response.json({ success: false, message: "Doubt not found" }, { status: 404 });
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
        
        return Response.json({ 
          success: true, 
          message: "Doubt reopened for further assistance",
          pointsAwarded: reducedPoints 
        });
      } else {
        return Response.json({ success: false, message: "Doubt not found" }, { status: 404 });
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
