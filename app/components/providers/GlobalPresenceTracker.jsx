"use client";

import { useEffect, useRef } from 'react';
import { presenceTracker, updateCurrentPage } from '@/lib/presence-tracker';
import { usePathname } from 'next/navigation';
import AuthUtils from '@/lib/auth-utils-secure';

const GlobalPresenceTracker = () => {
  const isInitialized = useRef(false);
  const currentUser = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAndTrackUser = () => {
      try {
        if (AuthUtils.isAuthenticated()) {
          const userData = AuthUtils.getUserData();
          
          // If user changed or we haven't initialized tracking yet
          if (!isInitialized.current || currentUser.current?.roll !== userData.roll) {
            console.log('Starting global presence tracking for:', userData.name);
            
            // Stop previous tracking if exists
            if (isInitialized.current) {
              presenceTracker.stopTracking();
            }
            
            // Start tracking for the current user with current page
            presenceTracker.startTracking(userData.roll, userData.name, pathname);
            currentUser.current = userData;
            isInitialized.current = true;
          }
        } else {
          // User logged out, stop tracking
          if (isInitialized.current) {
            console.log('Stopping presence tracking - user logged out');
            presenceTracker.stopTracking();
            isInitialized.current = false;
            currentUser.current = null;
          }
        }
      } catch (error) {
        console.error('Error in global presence tracking:', error);
      }
    };

    // Initial check
    checkAndTrackUser();

    // Listen for storage changes (user login/logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        console.log('User session changed, updating presence tracking');
        checkAndTrackUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodic check to ensure tracking is active (every 30 seconds)
    const intervalId = setInterval(() => {
      if (isInitialized.current && currentUser.current) {
        // Ensure tracking is still active by checking if heartbeat is running
        try {
          if (!presenceTracker.isTracking) {
            console.log('Presence tracking lost, restarting...');
            checkAndTrackUser();
          }
        } catch (error) {
          console.error('Error checking presence tracking status:', error);
          checkAndTrackUser();
        }
      }
    }, 30000);

    // Handle page visibility changes for better tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden, log but maintain tracking
        console.log('Page hidden - maintaining presence tracking');
      } else {
        // Page became visible, ensure tracking is active
        console.log('Page visible - ensuring presence tracking is active');
        if (isInitialized.current && currentUser.current) {
          // Refresh heartbeat to show activity
          try {
            if (presenceTracker.isTracking) {
              // Trigger a heartbeat update
              console.log('Refreshing presence activity for page visibility');
            } else {
              // Restart tracking if it was lost
              checkAndTrackUser();
            }
          } catch (error) {
            console.error('Error refreshing presence on visibility change:', error);
            checkAndTrackUser();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload to gracefully stop tracking
    const handleBeforeUnload = () => {
      if (isInitialized.current) {
        // Firebase onDisconnect will handle the actual cleanup
        console.log('Page unloading - Firebase onDisconnect will handle presence cleanup');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      
      // Don't stop tracking here as the component might just be unmounting due to navigation
      // Firebase onDisconnect will handle actual disconnect scenarios
    };
  }, []); // Remove pathname dependency

  // Track page changes for admin monitoring
  useEffect(() => {
    if (currentUser.current && pathname) {
      console.log('Page changed to:', pathname);
      updateCurrentPage(currentUser.current.roll, pathname);
    }
  }, [pathname]);

  // This component doesn't render anything
  return null;
};

export default GlobalPresenceTracker;
