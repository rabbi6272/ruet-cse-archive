"use client";

import { useState, useEffect } from "react";
import { useActiveUsers, formatTimeAgo } from "@/lib/presence-tracker";

const ActiveUsersList = ({ className = "" }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    try {
      // Subscribe to active users list
      unsubscribe = useActiveUsers((users) => {
        setActiveUsers(users);
        setLoading(false);
        setError(null);
      });
    } catch (err) {
      console.error('Error setting up active users tracking:', err);
      setError('Failed to load active users');
      setLoading(false);
    }

    // Cleanup subscription
    return () => {
      try {
        if (unsubscribe) unsubscribe();
      } catch (err) {
        console.error('Error cleaning up active users subscription:', err);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            Active Users
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-pulse flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-700 ${className}`}>
        <div className="px-4 py-3 border-b border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-500"></i>
            Active Users
          </h3>
        </div>
        <div className="p-6 text-center">
          <i className="fas fa-wifi text-3xl text-red-400 mb-3"></i>
          <p className="text-red-600 dark:text-red-400 font-medium">Connection Error</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Unable to load active users at the moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <span>Active Users</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} online)
            </span>
          </div>
          
          {/* Real-time indicator */}
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Live</span>
          </div>
        </h3>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeUsers.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {activeUsers.map((user) => (
              <div 
                key={user.roll} 
                className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                        {/* Avatar with online indicator */}
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {/* Online/Grace period indicator */}
                          {user.isOnline ? (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                              <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                          ) : user.isInGracePeriod ? (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-white dark:border-gray-800 rounded-full">
                              <div className="w-full h-full bg-yellow-500 rounded-full animate-pulse"></div>
                            </div>
                          ) : (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          )}
                        </div>                  {/* User info */}
                  <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user.name}
                              </p>
                              {user.isOnline ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Online
                                </span>
                              ) : user.isInGracePeriod ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                  Recently Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                  Offline
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-id-badge"></i>
                        Roll: {user.roll}
                      </span>
                      
                      {user.timestamp && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-clock"></i>
                          Active {formatTimeAgo(user.timestamp)}
                        </span>
                      )}
                      
                      {user.sessionId && (
                        <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                          <i className="fas fa-link"></i>
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Connection status indicator */}
                  <div className="flex-shrink-0">
                    {user.isOnline ? (
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Live
                        </span>
                      </div>
                    ) : user.isInGracePeriod ? (
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                          Away
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/20 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-400">
                          Offline
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <i className="fas fa-user-slash text-2xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No Active Users
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Users will appear here when they visit the platform
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with refresh info */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <i className="fas fa-sync-alt animate-spin-slow"></i>
            <span className="hidden sm:inline">Updates in real-time</span>
            <span className="sm:hidden">Live updates</span>
          </span>
          <span className="flex items-center gap-1">
            <i className="fas fa-clock"></i>
            <span className="hidden sm:inline">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActiveUsersList;
