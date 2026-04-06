"use client";

import { useState, useEffect } from "react";
import { formatTimeAgo } from "@/lib/PresenceTracker";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// Password for accessing this page
const ADMIN_PASSWORD = "bittoismad";

export default function UserActivityTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [allUserSessions, setAllUserSessions] = useState([]);

  // Check if already authenticated on page load
  useEffect(() => {
    const savedAuth = localStorage.getItem("admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Handle password authentication
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setAuthError("");

    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      setPasswordInput("");
    } else {
      setAuthError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
  };

  // Get all user sessions and presence history
  useEffect(() => {
    if (!isAuthenticated) return;

    const sessionsRef = ref(db, "activeSessions");
    const presenceRef = ref(db, "presence");

    // Listen to all sessions
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const sessionsData = snapshot.val() || {};
      const sessionsList = Object.entries(sessionsData).map(
        ([roll, session]) => ({
          roll,
          ...session,
          type: "session",
        }),
      );
      setAllUserSessions(sessionsList);
    });

    return () => {
      unsubscribeSessions();
    };
  }, [isAuthenticated]);

  const formatSessionDuration = (startTime, endTime) => {
    if (!startTime) return "Unknown";

    try {
      let start = startTime;
      let end = endTime || Date.now();

      if (typeof startTime === "object" && startTime.seconds) {
        start = startTime.seconds * 1000;
      }
      if (typeof endTime === "object" && endTime.seconds) {
        end = endTime.seconds * 1000;
      }

      const duration = end - start;
      const minutes = Math.floor(duration / 60000);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="text-blue-500 text-6xl mb-4">�</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-600">
              Please enter the admin password to access user activity tracking.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {authError && (
              <div className="text-red-600 text-sm text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                User Sessions Tracker
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete history of user sessions and activity
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Sessions Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All User Sessions ({allUserSessions.length})
              </h2>
              <p className="text-sm text-gray-600">
                Complete history of user sessions and activity
              </p>
            </div>

            {allUserSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-500">No session data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUserSessions
                      .sort((a, b) => {
                        const aTime = a.lastActivity?.seconds
                          ? a.lastActivity.seconds * 1000
                          : 0;
                        const bTime = b.lastActivity?.seconds
                          ? b.lastActivity.seconds * 1000
                          : 0;
                        return bTime - aTime; // Most recent first
                      })
                      .map((session, index) => (
                        <tr
                          key={`${session.roll}-${session.sessionId}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.roll}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                session.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : session.status === "disconnected"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : session.status === "ended"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {session.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(session.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatSessionDuration(
                              session.startTime,
                              session.endTime,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.currentPage || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(session.lastActivity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {session.sessionId?.slice(-8) || "Unknown"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
