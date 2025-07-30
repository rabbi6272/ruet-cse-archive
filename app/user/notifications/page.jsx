"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

import { ref, onValue, off } from "firebase/database";
import { formatDistanceToNow } from "date-fns";

import { db } from "@/lib/firebase";
import { users } from "@/lib/mino";

import Loading from "../../loading";

function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);
  if (!user) return "Unknown User";
  return user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.roll) {
      setNotifications([]);
      return;
    }

    const notificationsRef = ref(db, `notifications/${user.roll}`);
    const fetchNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const notificationsArray = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(notificationsArray);
      } else {
        setNotifications([]);
      }
    });

    return () => off(notificationsRef, "value", fetchNotifications);
  }, [user?.roll]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "comment":
        return <i className="fas fa-comment text-green-500"></i>;
      case "reply":
        return <i className="fas fa-reply text-blue-500"></i>;
      case "mention":
        return <i className="fas fa-at text-purple-500"></i>;
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
    const timeAgo = formatTimeAgo(notification.createdAt);
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
          content: notification.commentText,
        };
      case "reply":
        return {
          main: `${fromUser} replied to your comment on ${snippetAuthor}'s code "${snippetTitle}"`,
          time: timeAgo,
          content: notification.commentText,
        };
      case "mention":
        return {
          main: `${fromUser} mentioned you in ${snippetAuthor}'s code "${snippetTitle}"`,
          time: timeAgo,
          content: notification.commentText,
        };
      default:
        return {
          main: notification.message || "New notification",
          time: timeAgo,
          content: notification.commentText,
        };
    }
  };

  // Test function to create a notification (REMOVED - no longer needed)

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please login to view your notifications
          </p>
          <Link
            href="/user/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-bell text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Stay updated with your activities
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <i className="fas fa-user mr-1"></i>
              {getNameFromRoll(user.roll)} ({user.roll})
            </span>
            <span>
              <i className="fas fa-bell mr-1"></i>
              {notifications.length} notifications
            </span>
            <span>
              <i className="fas fa-clock mr-1"></i>
              Real-time updates
            </span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bell-slash text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No notifications found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You're all caught up! Notifications will appear here when you
              receive them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const formattedNotification =
                formatNotificationMessage(notification);

              return (
                <div
                  key={notification.id}
                  className={`p-3 lg:p-6 transition-all duration-200 ${
                    !notification.read
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-2 lg:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                            {formattedNotification.main}
                          </p>

                          {formattedNotification.content && (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2">
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                "{formattedNotification.content}"
                              </p>
                            </div>
                          )}

                          <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                            {/* Display formatted time */}
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {formattedNotification.time}
                            </span>

                            {/* Display notification type with icon */}
                            <span>
                              <i
                                className={`fas fa-circle mr-1 ${
                                  notification.type === "comment"
                                    ? "text-green-500"
                                    : notification.type === "reply"
                                    ? "text-blue-500"
                                    : "text-purple-500"
                                }`}
                              ></i>
                              {notification.type}
                            </span>

                            {/* Display "New" badge if notification is unread */}
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                <i
                                  className="fas fa-circle text-blue-500 mr-1"
                                  style={{ fontSize: "6px" }}
                                ></i>
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
