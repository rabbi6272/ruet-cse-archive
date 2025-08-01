import { db } from '@/lib/firebase';
import { ref, onValue, push, remove, set, query, orderByChild, equalTo } from 'firebase/database';
import studentsData from '@/db/students.json';

// Global notification types that appear for all users
export const GLOBAL_NOTIFICATION_TYPES = {
  DOUBT_ASSEMBLY: 'doubt_assembly'
};

// Send a global notification to all users
export const sendGlobalNotification = async (notificationData) => {
  try {
    // Get all student rolls from the JSON file
    const allStudentRolls = studentsData.map(student => student.roll);
    
    // Send notification to each user
    const notificationPromises = allStudentRolls.map(async (roll) => {
      const userNotificationRef = ref(db, `notifications/${roll}`);
      return push(userNotificationRef, {
        ...notificationData,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        read: false,
        global: true // Mark as global notification
      });
    });

    await Promise.all(notificationPromises);
    console.log(`Global notification sent to ${allStudentRolls.length} users`);
    return { success: true, count: allStudentRolls.length };
  } catch (error) {
    console.error('Error sending global notification:', error);
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

// Check if there are any unsolved doubts
export const hasUnsolvedDoubts = async () => {
  return new Promise((resolve) => {
    const doubtsRef = ref(db, 'doubts');
    onValue(doubtsRef, (snapshot) => {
      const doubts = snapshot.val() || {};
      const unsolvedExists = Object.values(doubts).some(doubt => 
        doubt.status === 'pending' || doubt.status === 'assigned'
      );
      resolve(unsolvedExists);
    }, { onlyOnce: true });
  });
};

// Check if assembly notification already exists for any user
export const hasAssemblyNotification = async () => {
  return new Promise((resolve) => {
    // Check first user (if any user has it, all users have it since it's global)
    const firstUserRoll = studentsData[0]?.roll;
    if (!firstUserRoll) {
      resolve(false);
      return;
    }

    const userNotificationsRef = ref(db, `notifications/${firstUserRoll}`);
    onValue(userNotificationsRef, (snapshot) => {
      const notifications = snapshot.val() || {};
      const hasAssembly = Object.values(notifications).some(notification => 
        notification.type === GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY && 
        notification.global
      );
      resolve(hasAssembly);
    }, { onlyOnce: true });
  });
};

// Send Avengers assembly notification
export const sendAvengersAssemblyNotification = async () => {
  try {
    // Check if assembly notification already exists
    const alreadyExists = await hasAssemblyNotification();
    if (alreadyExists) {
      console.log('Assembly notification already exists, skipping...');
      return { success: true, message: 'Assembly notification already exists' };
    }

    const assemblyNotification = {
      type: GLOBAL_NOTIFICATION_TYPES.DOUBT_ASSEMBLY,
      title: "🦸‍♂️ Avengers, Assemble! 🦸‍♀️",
      message: "A fellow coder needs your help! Join the mission to solve doubts and save the day.",
      link: "/reviewers/dashboard",
      icon: "🚨",
      priority: "high",
      autoRemove: true // Will be automatically removed when no unsolved doubts remain
    };

    const result = await sendGlobalNotification(assemblyNotification);
    console.log('Avengers assembly notification sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending Avengers assembly notification:', error);
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
      console.log('All doubts resolved - Assembly notification removed');
      return { success: true, message: 'Assembly notification removed - mission complete!' };
    }
    
    return { success: true, message: 'Unsolved doubts still exist, keeping assembly notification' };
  } catch (error) {
    console.error('Error checking/removing assembly notification:', error);
    throw error;
  }
};
