import { db } from "@/lib/firebase";
import {
  ref,
  onValue,
  onDisconnect,
  serverTimestamp,
  set,
  remove,
  push,
} from "firebase/database";

// Track active users using Firebase's built-in presence detection
const PRESENCE_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds (grace period after disconnect)
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds heartbeat

export class PresenceTracker {
  constructor() {
    this.presenceRef = null;
    this.userPresenceRef = null;
    this.userSessionRef = null;
    this.isTracking = false;
    this.currentUser = null;
    this.heartbeatInterval = null;
    this.connectionRef = null;
    this.isOnlineRef = null;
  }

  // Start tracking user presence with Firebase connection state
  startTracking(userRoll, userName, currentPage = null) {
    // Check if database is available (client-side only)
    if (!db) {
      return;
    }

    if (this.isTracking) {
      this.stopTracking();
    }

    this.currentUser = { roll: userRoll, name: userName, currentPage };

    try {
      // Use Firebase's built-in connection detection
      this.connectionRef = ref(db, ".info/connected");
      this.isOnlineRef = ref(db, `presence/${userRoll}`);
      this.userSessionRef = ref(db, `activeSessions/${userRoll}`);
      this.userActivityRef = ref(db, `userActivity/${userRoll}`);
    } catch (error) {
      console.error(
        "Failed to initialize Firebase refs for presence tracking:",
        error,
      );
      return;
    }

    // Monitor connection state
    onValue(this.connectionRef, (snapshot) => {
      if (snapshot.val() === true) {
        // We're connected (or reconnected)
        this.setUserOnline();
      }
    });

    this.isTracking = true;
  }

  // Set user as online with session tracking
  setUserOnline() {
    if (!this.currentUser || !this.isOnlineRef || !this.userSessionRef) return;

    const sessionId =
      Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();

    const presenceData = {
      name: this.currentUser.name,
      roll: this.currentUser.roll,
      lastSeen: serverTimestamp(),
      isOnline: true,
      timestamp: timestamp,
      sessionId: sessionId,
      connectedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      currentPage: this.currentUser.currentPage || "Unknown",
    };

    const sessionData = {
      name: this.currentUser.name,
      roll: this.currentUser.roll,
      sessionId: sessionId,
      startTime: serverTimestamp(),
      lastActivity: serverTimestamp(),
      currentPage: this.currentUser.currentPage || "Unknown",
      status: "active",
    };

    // Activity log entry
    const activityData = {
      name: this.currentUser.name,
      roll: this.currentUser.roll,
      sessionId: sessionId,
      timestamp: serverTimestamp(),
      action: "session_start",
      page: this.currentUser.currentPage || "Unknown",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
    };

    // Set presence data
    set(this.isOnlineRef, presenceData);
    set(this.userSessionRef, sessionData);

    // Log activity
    if (this.userActivityRef) {
      const activityLogRef = push(this.userActivityRef);
      set(activityLogRef, activityData);
    }

    // When disconnected, remove presence and update session
    onDisconnect(this.isOnlineRef).remove();
    onDisconnect(this.userSessionRef).update({
      endTime: serverTimestamp(),
      status: "disconnected",
      lastActivity: serverTimestamp(),
    });

    // Start heartbeat to maintain active status
    this.startHeartbeat();
  }

  // Heartbeat to maintain active session
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isOnlineRef && this.userSessionRef && this.currentUser) {
        const now = Date.now();

        // Update presence timestamp
        set(this.isOnlineRef, {
          name: this.currentUser.name,
          roll: this.currentUser.roll,
          lastSeen: serverTimestamp(),
          isOnline: true,
          timestamp: now,
          sessionId: this.currentUser.sessionId || "unknown",
          connectedAt: this.currentUser.connectedAt || serverTimestamp(),
          lastActivity: serverTimestamp(),
          currentPage: this.currentUser.currentPage || "Unknown",
        });

        // Update session activity
        if (this.userSessionRef) {
          set(this.userSessionRef, {
            name: this.currentUser.name,
            roll: this.currentUser.roll,
            sessionId: this.currentUser.sessionId || "unknown",
            startTime: this.currentUser.connectedAt || serverTimestamp(),
            lastActivity: serverTimestamp(),
            currentPage: this.currentUser.currentPage || "Unknown",
            status: "active",
          });
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  // Stop tracking user presence
  stopTracking() {
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clean disconnect handling with 2-minute grace period
    if (this.isOnlineRef && this.currentUser) {
      // Set user as offline but keep them in the presence list for grace period
      set(this.isOnlineRef, {
        name: this.currentUser.name,
        roll: this.currentUser.roll,
        lastSeen: serverTimestamp(),
        isOnline: false, // Mark as offline
        timestamp: Date.now(), // This timestamp will be used for the 2-minute grace period
        sessionId: this.currentUser.sessionId || "unknown",
        disconnectedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }).catch((error) => {
        console.error("Error during disconnect:", error);
      });

      // Note: We don't remove the presence immediately anymore
      // The cleanup process will handle removal after 2 minutes
    }

    // Update session end time
    if (this.userSessionRef && this.currentUser) {
      set(this.userSessionRef, {
        name: this.currentUser.name,
        roll: this.currentUser.roll,
        sessionId: this.currentUser.sessionId || "unknown",
        startTime: this.currentUser.connectedAt || serverTimestamp(),
        endTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
        status: "ended",
      }).catch((error) => {
        console.error("Error updating session end:", error);
      });
    }

    // Clean up references
    if (this.connectionRef) {
      // Note: Don't call off() on .info/connected as it's a special Firebase reference
      this.connectionRef = null;
    }

    this.isTracking = false;
    this.currentUser = null;
    this.isOnlineRef = null;
    this.userSessionRef = null;
  }

  // Get count of active users with better filtering (includes 2-minute grace period)
  getActiveUsersCount(callback) {
    const presenceRef = ref(db, "presence");

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const now = Date.now();

      // Count users who are active OR within 2-minute grace period after disconnect
      const activeCount = Object.values(presenceData).filter((user) => {
        if (!user || !user.timestamp) return false;
        const timeDiff = now - user.timestamp;

        // Include users who are either:
        // 1. Currently online (isOnline: true)
        // 2. Recently disconnected but within 2-minute grace period
        return timeDiff < PRESENCE_TIMEOUT;
      }).length;

      callback(activeCount);
    });

    return unsubscribe;
  }

  // Get list of active users with session validation (includes 2-minute grace period)
  getActiveUsers(callback) {
    const presenceRef = ref(db, "presence");

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const now = Date.now();

      // Get users who are active OR within 2-minute grace period
      const activeUsers = Object.values(presenceData)
        .filter((user) => {
          if (!user || !user.timestamp) return false;
          const timeDiff = now - user.timestamp;

          // Include users within 2-minute grace period regardless of isOnline status
          return timeDiff < PRESENCE_TIMEOUT;
        })
        .map((user) => ({
          name: user.name,
          roll: user.roll,
          lastSeen: user.lastSeen,
          isOnline: user.isOnline,
          sessionId: user.sessionId,
          connectedAt: user.connectedAt,
          timestamp: user.timestamp,
          lastActivity: user.lastActivity,
          // Add a computed field to show if user is in grace period
          isInGracePeriod:
            !user.isOnline && now - user.timestamp < PRESENCE_TIMEOUT,
        }))
        .sort((a, b) => {
          // Sort by online status first (online users first), then by name
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return a.name.localeCompare(b.name);
        });

      callback(activeUsers);
    });

    return unsubscribe;
  }

  // Get active sessions for admin/debugging purposes
  getActiveSessions(callback) {
    const sessionsRef = ref(db, "activeSessions");

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const sessionsData = snapshot.val() || {};
      const now = Date.now();

      const activeSessions = Object.entries(sessionsData)
        .filter(([roll, session]) => {
          if (!session || session.status !== "active") return false;
          // Check if session is recent (last activity within timeout)
          const lastActivity = session.lastActivity;
          if (typeof lastActivity === "object" && lastActivity.seconds) {
            const lastActivityTime = lastActivity.seconds * 1000;
            return now - lastActivityTime < PRESENCE_TIMEOUT;
          }
          return false;
        })
        .map(([roll, session]) => ({
          roll,
          ...session,
        }));

      callback(activeSessions);
    });

    return unsubscribe;
  }

  // Cleanup stale sessions (can be called periodically) - now uses 2-minute grace period
  cleanupStaleSessions() {
    // Only run on client-side
    if (typeof window === "undefined") {
      return;
    }

    // Check if database is available (client-side only)
    if (!db) {
      console.log("Database not available for presence cleanup");
      return;
    }

    const sessionsRef = ref(db, "activeSessions");
    const presenceRef = ref(db, "presence");

    onValue(
      sessionsRef,
      (snapshot) => {
        const sessionsData = snapshot.val() || {};
        const now = Date.now();

        Object.entries(sessionsData).forEach(([roll, session]) => {
          if (!session || !session.lastActivity) return;

          let lastActivityTime = now;
          if (
            typeof session.lastActivity === "object" &&
            session.lastActivity.seconds
          ) {
            lastActivityTime = session.lastActivity.seconds * 1000;
          }

          // If session is stale (older than 2-minute grace period), clean it up
          if (now - lastActivityTime > PRESENCE_TIMEOUT) {
            console.log(
              `Cleaning up stale session for user: ${roll} (inactive for ${Math.round((now - lastActivityTime) / 60000)} minutes)`,
            );

            // Remove from presence completely
            const userPresenceRef = ref(db, `presence/${roll}`);
            remove(userPresenceRef);

            // Update session status
            const userSessionRef = ref(db, `activeSessions/${roll}`);
            set(userSessionRef, {
              ...session,
              status: "expired",
              endTime: serverTimestamp(),
            });
          }
        });
      },
      { onlyOnce: true },
    );
  }
}

// Export singleton instance
export const presenceTracker = new PresenceTracker();

// Start periodic cleanup of stale sessions (every 2 minutes) - client-side only
if (typeof window !== "undefined") {
  setInterval(
    () => {
      presenceTracker.cleanupStaleSessions();
    },
    2 * 60 * 1000,
  );
}

// React hook for active users count with better error handling
export const useActiveUsersCount = (callback) => {
  const tracker = new PresenceTracker();

  const wrappedCallback = (count) => {
    try {
      callback(count);
    } catch (error) {
      console.error("Error in useActiveUsersCount callback:", error);
      callback(0); // Fallback to 0 if there's an error
    }
  };

  return tracker.getActiveUsersCount(wrappedCallback);
};

// React hook for active users list with better error handling
export const useActiveUsers = (callback) => {
  const tracker = new PresenceTracker();

  const wrappedCallback = (users) => {
    try {
      callback(users);
    } catch (error) {
      console.error("Error in useActiveUsers callback:", error);
      callback([]); // Fallback to empty array if there's an error
    }
  };

  return tracker.getActiveUsers(wrappedCallback);
};

// React hook for active sessions (for admin/debugging)
export const useActiveSessions = (callback) => {
  const tracker = new PresenceTracker();

  const wrappedCallback = (sessions) => {
    try {
      callback(sessions);
    } catch (error) {
      console.error("Error in useActiveSessions callback:", error);
      callback([]); // Fallback to empty array if there's an error
    }
  };

  return tracker.getActiveSessions(wrappedCallback);
};

// Utility to format time ago with better handling
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Unknown";

  try {
    const now = Date.now();
    let time = timestamp;

    // Handle Firebase serverTimestamp objects
    if (typeof timestamp === "object" && timestamp.seconds) {
      time = timestamp.seconds * 1000;
    }

    const diff = now - time;

    if (diff < 0) return "Just now"; // Future timestamp
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Unknown";
  }
};

// Utility to check if user is currently online
export const isUserOnline = async (userRoll) => {
  return new Promise((resolve) => {
    if (!db) {
      resolve(false);
      return;
    }

    const userPresenceRef = ref(db, `presence/${userRoll}`);
    onValue(
      userPresenceRef,
      (snapshot) => {
        const userData = snapshot.val();
        if (!userData) {
          resolve(false);
          return;
        }

        const now = Date.now();
        const isOnline =
          userData.isOnline &&
          userData.timestamp &&
          now - userData.timestamp < PRESENCE_TIMEOUT;

        resolve(isOnline);
      },
      { onlyOnce: true },
    );
  });
};

// Utility to get total active users count (without callback)
export const getActiveUsersCountSync = async () => {
  return new Promise((resolve) => {
    if (!db) {
      resolve(0);
      return;
    }

    const presenceRef = ref(db, "presence");
    onValue(
      presenceRef,
      (snapshot) => {
        const presenceData = snapshot.val() || {};
        const now = Date.now();

        const activeCount = Object.values(presenceData).filter((user) => {
          if (!user || !user.timestamp || !user.isOnline) return false;
          return now - user.timestamp < PRESENCE_TIMEOUT;
        }).length;

        resolve(activeCount);
      },
      { onlyOnce: true },
    );
  });
};

// Method to update current page for admin tracking
export const updateCurrentPage = (userRoll, pagePath) => {
  if (!userRoll || !pagePath || !db) return;

  const presenceRef = ref(db, `presence/${userRoll}`);
  const sessionRef = ref(db, `activeSessions/${userRoll}`);
  const activityRef = ref(db, `userActivity/${userRoll}`);

  // Update current page in presence
  onValue(
    presenceRef,
    (snapshot) => {
      const currentData = snapshot.val();
      if (currentData) {
        set(presenceRef, {
          ...currentData,
          currentPage: pagePath,
          lastActivity: serverTimestamp(),
        });
      }
    },
    { onlyOnce: true },
  );

  // Update current page in session
  onValue(
    sessionRef,
    (snapshot) => {
      const currentSession = snapshot.val();
      if (currentSession) {
        set(sessionRef, {
          ...currentSession,
          currentPage: pagePath,
          lastActivity: serverTimestamp(),
        });
      }
    },
    { onlyOnce: true },
  );

  // Log page navigation activity
  const activityLogRef = push(activityRef);
  set(activityLogRef, {
    timestamp: serverTimestamp(),
    action: "page_navigation",
    page: pagePath,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
  });
};

// React hook for user activity logs (for admin)
export const useUserActivity = (userRoll, callback) => {
  if (!userRoll || !db) return () => {};

  const activityRef = ref(db, `userActivity/${userRoll}`);

  const unsubscribe = onValue(activityRef, (snapshot) => {
    const activityData = snapshot.val() || {};
    const activities = Object.entries(activityData)
      .map(([key, activity]) => ({
        id: key,
        ...activity,
      }))
      .sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0;
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0;
        return bTime - aTime; // Most recent first
      });

    callback(activities);
  });

  return unsubscribe;
};

// React hook for all users activity (for admin dashboard)
export const useAllUsersActivity = (callback) => {
  if (!db) return () => {};

  const activityRef = ref(db, "userActivity");

  const unsubscribe = onValue(activityRef, (snapshot) => {
    const allActivityData = snapshot.val() || {};
    const allActivities = [];

    Object.entries(allActivityData).forEach(([userRoll, userActivities]) => {
      Object.entries(userActivities).forEach(([activityId, activity]) => {
        allActivities.push({
          id: activityId,
          userRoll,
          ...activity,
        });
      });
    });

    // Sort by timestamp (most recent first)
    allActivities.sort((a, b) => {
      const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0;
      const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0;
      return bTime - aTime;
    });

    callback(allActivities);
  });

  return unsubscribe;
};
