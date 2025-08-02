import { 
  testSendAssemblyNotification,
  manageAssemblyNotification,
  hasUnsolvedDoubts,
  hasAssemblyNotification,
  removeGlobalNotification,
  GLOBAL_NOTIFICATION_TYPES
} from "@/lib/global-notifications";

export async function POST(request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "test_send":
        // Force send a test assembly notification
        const result = await testSendAssemblyNotification();
        return Response.json({ 
          success: true, 
          message: "Test notification sent!",
          result 
        });

      case "check_status":
        // Check current status
        const unsolvedExists = await hasUnsolvedDoubts();
        const notificationExists = await hasAssemblyNotification();
        
        return Response.json({
          success: true,
          status: {
            unsolvedDoubts: unsolvedExists,
            assemblyNotificationExists: notificationExists
          }
        });

      case "manage":
        // Run the management algorithm
        const managementResult = await manageAssemblyNotification();
        return Response.json({
          success: true,
          message: "Management completed",
          result: managementResult
        });

      case "clear_all":
        // Clear all assembly notifications
        await removeGlobalNotification(GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY);
        return Response.json({
          success: true,
          message: "All assembly notifications cleared"
        });

      default:
        return Response.json({ 
          success: false, 
          message: "Invalid action. Use: test_send, check_status, manage, or clear_all" 
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Test assembly API error:", error);
    return Response.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: "Assembly Notification Test API",
    actions: {
      test_send: "Send a test assembly notification to all users",
      check_status: "Check current doubt and notification status", 
      manage: "Run the automatic management algorithm",
      clear_all: "Clear all assembly notifications"
    },
    usage: "POST with { action: 'action_name' }"
  });
}
