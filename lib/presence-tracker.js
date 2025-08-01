import { db } from '@/lib/firebase';
import { ref, onValue, onDisconnect, serverTimestamp, set, off } from 'firebase/database';

// Track active users who are currently online
const PRESENCE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export class PresenceTracker {
  constructor() {
    this.presenceRef = null;
    this.userPresenceRef = null;
    this.isTracking = false;
    this.currentUser = null;
  }

  // Start tracking user presence
  startTracking(userRoll, userName) {
    if (this.isTracking) {
      this.stopTracking();
    }

    this.currentUser = { roll: userRoll, name: userName };
    
    // Reference to the user's presence
    this.userPresenceRef = ref(db, `presence/${userRoll}`);
    
    // Set user as online
    const presenceData = {
      name: userName,
      roll: userRoll,
      lastSeen: serverTimestamp(),
      isOnline: true,
      timestamp: Date.now()
    };

    set(this.userPresenceRef, presenceData);

    // Remove user from presence when they disconnect
    onDisconnect(this.userPresenceRef).remove();

    // Update presence every 2 minutes to show activity
    this.presenceInterval = setInterval(() => {
      if (this.userPresenceRef) {
        set(this.userPresenceRef, {
          ...presenceData,
          lastSeen: serverTimestamp(),
          timestamp: Date.now()
        });
      }
    }, 2 * 60 * 1000); // Update every 2 minutes

    this.isTracking = true;
  }

  // Stop tracking user presence
  stopTracking() {
    if (this.userPresenceRef) {
      // Set user as offline before removing
      set(this.userPresenceRef, {
        name: this.currentUser?.name || '',
        roll: this.currentUser?.roll || '',
        lastSeen: serverTimestamp(),
        isOnline: false,
        timestamp: Date.now()
      }).then(() => {
        // Remove the presence entry after setting offline
        setTimeout(() => {
          if (this.userPresenceRef) {
            set(this.userPresenceRef, null);
          }
        }, 1000);
      });
    }

    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    this.isTracking = false;
    this.currentUser = null;
  }

  // Get count of active users
  getActiveUsersCount(callback) {
    const presenceRef = ref(db, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const now = Date.now();
      
      // Count users who have been active in the last 5 minutes
      const activeCount = Object.values(presenceData).filter(user => {
        if (!user.timestamp) return false;
        return (now - user.timestamp) < PRESENCE_TIMEOUT;
      }).length;
      
      callback(activeCount);
    });

    return unsubscribe;
  }

  // Get list of active users with details
  getActiveUsers(callback) {
    const presenceRef = ref(db, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const now = Date.now();
      
      // Get users who have been active in the last 5 minutes
      const activeUsers = Object.values(presenceData)
        .filter(user => {
          if (!user.timestamp) return false;
          return (now - user.timestamp) < PRESENCE_TIMEOUT;
        })
        .map(user => ({
          name: user.name,
          roll: user.roll,
          lastSeen: user.lastSeen,
          isOnline: user.isOnline
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      callback(activeUsers);
    });

    return unsubscribe;
  }
}

// Export singleton instance
export const presenceTracker = new PresenceTracker();

// React hook for active users count
export const useActiveUsersCount = (callback) => {
  const tracker = new PresenceTracker();
  return tracker.getActiveUsersCount(callback);
};

// React hook for active users list
export const useActiveUsers = (callback) => {
  const tracker = new PresenceTracker();
  return tracker.getActiveUsers(callback);
};

// Utility to format time ago
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - (typeof timestamp === 'object' ? timestamp.seconds * 1000 : timestamp);
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};
