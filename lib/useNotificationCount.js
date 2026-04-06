"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { notificationSound } from "@/lib/notificationSound";
import { pageTitleManager } from "@/lib/PageTitleManager";

export const useNotificationCount = (
  userRoll,
  playSound = false,
  updatePageTitle = false,
) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const previousCountRef = useRef(0);

  const resetState = useCallback(() => {
    setUnreadCount(0);
    setIsLoading(false);
    setError(null);
    previousCountRef.current = 0;

    // Reset page title if enabled
    if (updatePageTitle) {
      pageTitleManager.updateTitle(0);
    }
  }, [updatePageTitle]);

  const playNotificationSound = useCallback(async () => {
    if (!playSound) return;

    try {
      // Try Web Audio API first
      await notificationSound.playNotificationSound();
    } catch (error) {
      console.log("Web Audio failed, trying fallback:", error);
      // Fallback to HTML5 Audio
      notificationSound.playFallbackSound();
    }
  }, [playSound]);

  useEffect(() => {
    if (!userRoll) {
      resetState();
      return;
    }

    setIsLoading(true);
    setError(null);

    const notificationsRef = ref(db, `notifications/${userRoll}`);

    const fetchNotifications = onValue(
      notificationsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();

          if (data) {
            const notificationsArray = Object.keys(data)
              .map((key) => ({
                id: key,
                ...data[key],
              }))
              .filter(
                (notification) =>
                  notification && typeof notification.read !== "undefined",
              ); // Filter out invalid notifications

            const newUnreadCount = notificationsArray.filter(
              (n) => !n.read,
            ).length;

            // Play sound if count increased and this isn't the initial load
            if (
              newUnreadCount > previousCountRef.current &&
              previousCountRef.current > 0
            ) {
              playNotificationSound();

              // Show "New Notification" title for new notifications
              if (updatePageTitle) {
                pageTitleManager.showNewNotification(newUnreadCount);
              }
            } else {
              // Update page title with count (for initial load or count decrease)
              if (updatePageTitle) {
                pageTitleManager.updateTitle(newUnreadCount);
              }
            }

            setUnreadCount(newUnreadCount);
            previousCountRef.current = newUnreadCount;
          } else {
            setUnreadCount(0);
            previousCountRef.current = 0;

            // Clear page title if enabled
            if (updatePageTitle) {
              pageTitleManager.updateTitle(0);
            }
          }

          setIsLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error processing notifications:", err);
          setError(err.message);
          setUnreadCount(0);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setError(error.message);
        setUnreadCount(0);
        setIsLoading(false);
      },
    );

    return () => off(notificationsRef, "value", fetchNotifications);
  }, [userRoll, resetState, playNotificationSound, updatePageTitle]);

  return { unreadCount, isLoading, error };
};
