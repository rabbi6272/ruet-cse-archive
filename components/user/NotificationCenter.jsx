"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, off, update, remove } from "firebase/database";
import { formatDistanceToNow } from "date-fns";
import { users } from "@/lib/mino";
import Link from "next/link";

function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const NotificationCenter = ({ userRoll }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    if (!userRoll) {
      return;
    }

    const notificationsRef = ref(db, `notifications/${userRoll}`);
    const fetchNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const notificationsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Latest first

        const newUnreadCount = notificationsArray.filter((n) => !n.read).length;

        // Play notification sound if there's a new notification
        if (newUnreadCount > previousCount && previousCount > 0) {
          playNotificationSound();
        }

        setNotifications(notificationsArray);
        setUnreadCount(newUnreadCount);
        setPreviousCount(newUnreadCount);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setPreviousCount(0);
      }
    });

    return () => off(notificationsRef, "value", fetchNotifications);
  }, [userRoll, previousCount]);

  const playNotificationSound = () => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment":
        return <i className="fas fa-comment text-green-500"></i>;
      case "reply":
        return <i className="fas fa-reply text-blue-500"></i>;
      case "mention":
        return <i className="fas fa-at text-purple-500"></i>;
      case "like":
        return <i className="fas fa-heart text-red-500"></i>;
      case "doubt_solved":
        return <i className="fas fa-check-circle text-green-500"></i>;
      case "doubt_assigned":
        return <i className="fas fa-user-check text-blue-500"></i>;
      default:
        return <i className="fas fa-bell text-gray-500"></i>;
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "some time ago";
    }
  };

  const formatNotificationMessage = (notification) => {
    const timeAgo = formatTimeAgo(
      notification.createdAt || notification.timestamp
    );
    const snippetTitle = notification.snippetTitle || "Untitled Code";
    const fromUser =
      notification.fromUserName || getNameFromRoll(notification.fromUserRoll);
    const snippetAuthor = notification.snippetAuthor
      ? getNameFromRoll(notification.snippetAuthor)
      : "someone";

    switch (notification.type) {
      case "comment":
        return {
          main: `${fromUser} commented on your code "${snippetTitle}"`,
          time: timeAgo,
        };
      case "reply":
        return {
          main: `${fromUser} replied to your comment on ${snippetAuthor}'s code "${snippetTitle}"`,
          time: timeAgo,
        };
      case "mention":
        return {
          main: `${fromUser} mentioned you in ${snippetAuthor}'s code "${snippetTitle}"`,
          time: timeAgo,
        };
      case "doubt_solved":
        return {
          main: notification.title || "Your doubt has been solved!",
          time: timeAgo,
        };
      case "doubt_assigned":
        return {
          main:
            notification.title || "Your doubt has been assigned to a reviewer",
          time: timeAgo,
        };
      default:
        return {
          main: notification.message || notification.title,
          time: timeAgo,
        };
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!userRoll) return;

    try {
      const notificationRef = ref(
        db,
        `notifications/${userRoll}/${notificationId}`
      );
      await update(notificationRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!userRoll) return;

    try {
      const notificationRef = ref(
        db,
        `notifications/${userRoll}/${notificationId}`
      );
      await remove(notificationRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userRoll || notifications.length === 0) return;

    try {
      const updates = {};
      notifications
        .filter((notification) => !notification.read)
        .forEach((notification) => {
          updates[`notifications/${userRoll}/${notification.id}/read`] = true;
          updates[`notifications/${userRoll}/${notification.id}/readAt`] =
            new Date().toISOString();
        });

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full ${
          unreadCount > 0
            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
        title={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "No new notifications"
        }
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.5rem] h-6 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white dark:border-gray-700">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed sm:absolute top-16 sm:top-auto right-2 sm:right-0 sm:mt-2 w-[calc(100vw-16px)] sm:w-80 md:w-96 lg:w-[450px] max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[calc(100vh-80px)] sm:max-h-[32rem] overflow-y-auto">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 font-medium"
              >
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">Read All</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-all duration-200 relative ${
                      !notification.read
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center text-white shadow-md">
                          <span className="text-sm sm:text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                            {formatNotificationMessage(notification).main}
                          </p>

                          {/* Time ago */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatNotificationMessage(notification).time}
                          </p>

                          {/* Comment Preview */}
                          {notification.commentText && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2 border-gray-300 dark:border-gray-600">
                              <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                "
                                {notification.commentText.length > 60
                                  ? notification.commentText.substring(0, 60) +
                                    "..."
                                  : notification.commentText}
                                "
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Notification Type Badge */}
                        {/* <div className="flex items-center justify-end">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              notification.type === "comment"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : notification.type === "reply"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                : notification.type === "mention"
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                : notification.type === "like"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {notification.type === "comment" && (
                              <>
                                <i className="fas fa-comment mr-1"></i>Comment
                              </>
                            )}
                            {notification.type === "reply" && (
                              <>
                                <i className="fas fa-reply mr-1"></i>Reply
                              </>
                            )}
                            {notification.type === "mention" && (
                              <>
                                <i className="fas fa-at mr-1"></i>Mention
                              </>
                            )}
                            {notification.type === "like" && (
                              <>
                                <i className="fas fa-heart mr-1"></i>Like
                              </>
                            )}
                            {!["comment", "reply", "mention", "like"].includes(
                              notification.type
                            ) && (
                              <>
                                <i className="fas fa-bell mr-1"></i>Notification
                              </>
                            )}
                          </span>
                        </div> */}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col items-end space-y-1 sm:space-y-2">
                        {/* View Snippet Button */}
                        {notification.relatedSnippetId && (
                          <Link
                            href={`/codelibrary/${notification.relatedSnippetId}`}
                            onClick={() => {
                              markAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className="text-xs px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 font-medium"
                          >
                            <span className="hidden sm:inline">
                              View Snippet
                            </span>
                            <span className="sm:hidden">View</span>
                          </Link>
                        )}

                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 font-medium"
                          >
                            <span className="hidden sm:inline">Mark read</span>
                            <span className="sm:hidden">Read</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-200 font-medium"
                        >
                          <span className="hidden sm:inline">✕ Delete</span>
                          <span className="sm:hidden">✕</span>
                        </button>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-2xl sm:text-4xl mb-3 sm:mb-4">
                  <i className="fas fa-bell-slash"></i>
                </div>
                <p className="text-base sm:text-lg mb-2">
                  No notifications found
                </p>
                <p className="text-sm px-2">
                  You'll be notified when someone interacts with your content
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 text-center">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close notifications when clicking outside */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
