import { db } from '@/lib/firebase';
import { ref, onValue, push, remove, set, query, orderByChild, equalTo } from 'firebase/database';
import studentsData from '@/db/students.json';

// Global notification types that appear for all users
export const GLOBAL_NOTIFICATION_TYPES = {
  DOUBT_ASSEMBLY: 'doubt_assembly'
};

// Debug logging function
const debugLog = (message, data = null) => {
  console.log(`[ASSEMBLY NOTIFICATION] ${message}`, data ? data : '');
};

// Send a global notification to all users - IMPROVED VERSION
export const sendGlobalNotification = async (notificationData) => {
  try {
    debugLog('Starting to send global notification', { type: notificationData.type });
    
    // Get all student rolls from the JSON file
    const allStudentRolls = studentsData.map(student => student.roll);
    debugLog(`Found ${allStudentRolls.length} students to notify`);
    
    // Create notification data with timestamp
    const notificationWithTime = {
      ...notificationData,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
      global: true
    };
    
    debugLog('Notification data prepared', notificationWithTime);
    
    // Send notification to each user synchronously to ensure delivery
    const results = [];
    for (const roll of allStudentRolls) {
      try {
        const userNotificationRef = ref(db, `notifications/${roll}`);
        const result = await push(userNotificationRef, notificationWithTime);
        results.push({ roll, success: true, id: result.key });
        debugLog(`✅ Notification sent to user ${roll}`, { id: result.key });
      } catch (error) {
        console.error(`❌ Failed to send notification to user ${roll}:`, error);
        results.push({ roll, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    debugLog(`Global notification completed: ${successCount}/${allStudentRolls.length} successful`);
    
    return { success: true, count: successCount, total: allStudentRolls.length, results };
  } catch (error) {
    console.error('❌ Error sending global notification:', error);
    throw error;
  }
};

// Remove global notifications of a specific type for all users
export const removeGlobalNotification = async (notificationType) => {
  try {
    const allStudentRolls = studentsData.map(student => student.roll);
    
    const removalPromises = allStudentRolls.map(async (roll) => {
      const userNotificationsRef = ref(db, `notifications/${roll}`);
      
      return new Promise((resolve) => {
        onValue(userNotificationsRef, (snapshot) => {
          const notifications = snapshot.val() || {};
          
          // Find and remove notifications of the specified type
          const removalTasks = Object.entries(notifications)
            .filter(([id, notification]) => 
              notification.type === notificationType && notification.global
            )
            .map(([id]) => {
              const notificationRef = ref(db, `notifications/${roll}/${id}`);
              return remove(notificationRef);
            });
          
          Promise.all(removalTasks).then(() => resolve());
        }, { onlyOnce: true });
      });
    });

    await Promise.all(removalPromises);
    console.log(`Global notifications of type '${notificationType}' removed from all users`);
    return { success: true, count: allStudentRolls.length };
  } catch (error) {
    console.error('Error removing global notifications:', error);
    throw error;
  }
};

// Check if there are any unsolved doubts - IMPROVED VERSION
export const hasUnsolvedDoubts = async () => {
  return new Promise((resolve) => {
    debugLog('Checking for unsolved doubts...');
    const doubtsRef = ref(db, 'doubts');
    onValue(doubtsRef, (snapshot) => {
      const doubts = snapshot.val() || {};
      const doubtEntries = Object.entries(doubts);
      
      debugLog(`Found ${doubtEntries.length} total doubts in database`);
      
      const unsolvedDoubts = doubtEntries.filter(([id, doubt]) => {
        const isUnsolved = doubt.status === 'pending' || doubt.status === 'assigned';
        if (isUnsolved) {
          debugLog(`Unsolved doubt found:`, { 
            id, 
            title: doubt.title, 
            status: doubt.status, 
            asker: doubt.userDetails?.name 
          });
        }
        return isUnsolved;
      });
      
      debugLog(`Found ${unsolvedDoubts.length} unsolved doubts`);
      resolve(unsolvedDoubts.length > 0);
    }, { onlyOnce: true });
  });
};

// Check if assembly notification already exists for any user - IMPROVED VERSION
export const hasAssemblyNotification = async () => {
  return new Promise((resolve) => {
    debugLog('Checking if assembly notification already exists...');
    
    // Check multiple users to be sure (not just first user)
    const sampleUsers = studentsData.slice(0, 3).map(student => student.roll);
    let checkCount = 0;
    let foundAssembly = false;
    
    const checkUser = (userRoll) => {
      const userNotificationsRef = ref(db, `notifications/${userRoll}`);
      onValue(userNotificationsRef, (snapshot) => {
        checkCount++;
        const notifications = snapshot.val() || {};
        const hasAssembly = Object.values(notifications).some(notification => 
          notification.type === GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY && 
          notification.global
        );
        
        if (hasAssembly) {
          debugLog(`✅ Assembly notification found for user ${userRoll}`);
          foundAssembly = true;
        }
        
        // Resolve when we've checked all sample users
        if (checkCount === sampleUsers.length) {
          debugLog(`Assembly notification check complete. Found: ${foundAssembly}`);
          resolve(foundAssembly);
        }
      }, { onlyOnce: true });
    };
    
    if (sampleUsers.length === 0) {
      debugLog('No users found to check');
      resolve(false);
      return;
    }
    
    sampleUsers.forEach(checkUser);
  });
};

// Send Avengers assembly notification with specific doubt information - IMPROVED VERSION
export const sendAvengersAssemblyNotification = async (doubtData = null) => {
  try {
    debugLog('🦸‍♂️ Starting Avengers Assembly notification process', doubtData ? { 
      asker: doubtData.userDetails?.name, 
      title: doubtData.title 
    } : null);
    
    // Check if assembly notification already exists
    const alreadyExists = await hasAssemblyNotification();
    if (alreadyExists) {
      debugLog('⚠️ Assembly notification already exists, skipping...');
      return { success: true, message: 'Assembly notification already exists' };
    }

    // Create personalized message based on doubt data
    let title = "🦸‍♂️ Avengers, Assemble! 🦸‍♀️";
    let message = "A fellow coder needs your help! Join the mission to solve doubts and save the day.";

    if (doubtData && doubtData.userDetails) {
      const askerName = doubtData.userDetails.name;
      title = `🦸‍♂️ Avengers, Assemble! ${askerName} needs help! 🦸‍♀️`;
      message = `${askerName} needs assistance with their coding doubt: "${doubtData.title}". Join the mission to help solve it!`;
      debugLog('📝 Personalized message created', { askerName, doubtTitle: doubtData.title });
    }

    const assemblyNotification = {
      type: GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY,
      title: title,
      message: message,
      link: "/reviewers/dashboard",
      icon: "🚨",
      priority: "high",
      autoRemove: true,
      doubtInfo: doubtData ? {
        askerName: doubtData.userDetails?.name,
        askerRoll: doubtData.userDetails?.roll,
        doubtTitle: doubtData.title,
        category: doubtData.category,
        doubtId: doubtData.id
      } : null
    };

    debugLog('🚀 Sending assembly notification to all users...');
    const result = await sendGlobalNotification(assemblyNotification);
    
    if (result.success && result.count > 0) {
      debugLog('✅ Avengers assembly notification sent successfully!', { 
        successCount: result.count, 
        totalUsers: result.total 
      });
      
      // Log for UI feedback
      console.log('🦸‍♂️ AVENGERS ASSEMBLY ACTIVATED! All users have been notified to help solve doubts!');
    } else {
      debugLog('❌ Failed to send assembly notification', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending Avengers assembly notification:', error);
    throw error;
  }
};

// Remove assembly notification when all doubts are solved
export const removeAssemblyNotificationIfResolved = async () => {
  try {
    const unsolvedExists = await hasUnsolvedDoubts();
    
    if (!unsolvedExists) {
      // No unsolved doubts, remove assembly notification
      await removeGlobalNotification(GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY);
      console.log('✅ MISSION COMPLETE! All doubts solved - Avengers Assembly notification removed!');
      return { success: true, message: 'Assembly notification removed - mission complete!' };
    }
    
    return { success: true, message: 'Unsolved doubts still exist, keeping assembly notification' };
  } catch (error) {
    console.error('Error checking/removing assembly notification:', error);
    throw error;
  }
};

// Automatically manage assembly notification based on doubt count - IMPROVED VERSION
export const manageAssemblyNotification = async (doubtData = null) => {
  try {
    debugLog('🔄 Starting assembly notification management...');
    
    const unsolvedExists = await hasUnsolvedDoubts();
    const notificationExists = await hasAssemblyNotification();
    
    debugLog('Current state:', { unsolvedExists, notificationExists });
    
    if (unsolvedExists && !notificationExists) {
      // There are unsolved doubts but no assembly notification - send it
      debugLog('📢 Unsolved doubts detected, sending assembly notification...');
      const result = await sendAvengersAssemblyNotification(doubtData);
      return { success: true, action: 'sent', message: 'Assembly notification sent - Avengers assembled!', result };
    } else if (!unsolvedExists && notificationExists) {
      // No unsolved doubts but assembly notification exists - remove it
      debugLog('🧹 No unsolved doubts, removing assembly notification...');
      await removeGlobalNotification(GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY);
      return { success: true, action: 'removed', message: 'Assembly notification removed - mission complete!' };
    } else if (unsolvedExists && notificationExists) {
      debugLog('✅ Assembly notification maintained - doubts still exist');
      return { success: true, action: 'maintained', message: 'Assembly notification maintained - doubts still exist' };
    } else {
      debugLog('😎 No doubts and no notification - all good');
      return { success: true, action: 'none', message: 'No doubts and no notification - all good' };
    }
  } catch (error) {
    console.error('❌ Error managing assembly notification:', error);
    throw error;
  }
};

// Test function to manually send assembly notification (for debugging)
export const testSendAssemblyNotification = async () => {
  try {
    debugLog('🧪 MANUAL TEST: Sending assembly notification...');
    
    const testDoubtData = {
      id: 'test-doubt-id',
      title: 'Test Coding Problem',
      category: 'Debug my code',
      userDetails: {
        name: 'Test User',
        roll: 'TEST123',
        email: 'test@example.com'
      }
    };
    
    // Force send notification (ignore if exists)
    const assemblyNotification = {
      type: GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY,
      title: `🧪 TEST: Avengers, Assemble! ${testDoubtData.userDetails.name} needs help! 🦸‍♀️`,
      message: `${testDoubtData.userDetails.name} needs assistance with their coding doubt: "${testDoubtData.title}". Join the mission to help solve it!`,
      link: "/reviewers/dashboard",
      icon: "🚨",
      priority: "high",
      autoRemove: true,
      isTest: true, // Mark as test notification
      doubtInfo: {
        askerName: testDoubtData.userDetails.name,
        askerRoll: testDoubtData.userDetails.roll,
        doubtTitle: testDoubtData.title,
        category: testDoubtData.category,
        doubtId: testDoubtData.id
      }
    };

    const result = await sendGlobalNotification(assemblyNotification);
    debugLog('🧪 TEST RESULT:', result);
    return result;
  } catch (error) {
    console.error('❌ Test notification failed:', error);
    throw error;
  }
};
