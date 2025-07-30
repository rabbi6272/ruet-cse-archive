import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";

export async function POST(request) {
  try {
    const { doubtId, action, userId } = await request.json();

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
        message: "A student has submitted a new coding doubt that needs review.",
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
      // Mark doubt as satisfied by user and move to archive
      const doubtRef = ref(db, `doubts/${doubtId}`);
      const archiveRef = ref(db, `resolvedDoubts/${doubtId}`);
      
      // Get current doubt data
      const doubtSnapshot = await new Promise((resolve) => {
        onValue(doubtRef, resolve, { onlyOnce: true });
      });
      
      const doubtData = doubtSnapshot.val();
      if (doubtData) {
        // Add satisfaction confirmation
        const finalData = {
          ...doubtData,
          userSatisfied: true,
          satisfiedAt: Date.now(),
          status: "completed"
        };
        
        // Move to archive
        await update(archiveRef, finalData);
        
        // Remove from pending/active doubts
        await remove(doubtRef);
        
        return Response.json({ success: true, message: "Doubt marked as satisfied and archived" });
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
