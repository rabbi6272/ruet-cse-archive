"use client";

import { useState, useEffect } from "react";
import { useActiveUsersCount, useActiveUsers, formatTimeAgo } from "@/lib/presence-tracker";

const ActiveUsersIndicator = ({ showDetails = false, className = "" }) => {
  const [activeCount, setActiveCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeCount = null;
    let unsubscribeUsers = null;

    try {
      // Subscribe to active users count
      unsubscribeCount = useActiveUsersCount((count) => {
        setActiveCount(count);
        setLoading(false);
        setError(null);
      });

      // Subscribe to active users list if needed
      if (showDetails) {
        unsubscribeUsers = useActiveUsers((users) => {
          setActiveUsers(users);
          setError(null);
        });
      }
    } catch (err) {
      console.error('Error setting up presence tracking:', err);
      setError('Failed to load active users');
      setLoading(false);
    }

    // Cleanup subscriptions
    return () => {
      try {
        if (unsubscribeCount) unsubscribeCount();
        if (unsubscribeUsers) unsubscribeUsers();
      } catch (err) {
        console.error('Error cleaning up presence subscriptions:', err);
      }
    };
  }, [showDetails]);

  const handleToggleUsersList = () => {
    if (!showDetails || error) return;
    setShowUsersList(!showUsersList);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 bg-gray-400 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md ${className}`}>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
        <span className="font-medium text-xs sm:text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 bg-red-500 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md ${className}`}>
        <i className="fas fa-exclamation-triangle text-xs sm:text-sm"></i>
        <span className="font-medium text-xs sm:text-sm">Error</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Active Users Counter */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md ${
          showDetails ? 'cursor-pointer hover:from-green-600 hover:to-emerald-700' : ''
        } transition-all duration-200`}
        onClick={handleToggleUsersList}
      >
        {/* Online indicator */}
        <div className="relative">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping"></div>
        </div>
        
        {/* Count display */}
        <div className="flex items-center gap-1">
          <i className="fas fa-users text-xs sm:text-sm"></i>
          <span className="font-medium text-xs sm:text-sm">
            <span className="hidden sm:inline">
              {activeCount === 0 ? 'No one' : activeCount === 1 ? '1 person' : `${activeCount} people`} online
            </span>
            <span className="sm:hidden">
              {activeCount === 0 ? '0' : activeCount} online
            </span>
          </span>
        </div>

        {/* Dropdown arrow if details are enabled */}
        {showDetails && (
          <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${
            showUsersList ? 'rotate-180' : ''
          }`}></i>
        )}
      </div>

      {/* Active Users List Dropdown */}
      {showDetails && showUsersList && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUsersList(false)}
          />
          
          {/* Responsive Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 md:w-96 lg:w-80 xl:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden 
                          /* Mobile positioning - Full width modal on very small screens */ 
                          max-[480px]:fixed max-[480px]:top-1/2 max-[480px]:left-1/2 max-[480px]:transform max-[480px]:-translate-x-1/2 max-[480px]:-translate-y-1/2 max-[480px]:w-80 max-[480px]:max-w-[90vw] max-[480px]:mt-0
                          /* Small mobile positioning - Bottom sheet style */
                          min-[481px]:max-[640px]:fixed min-[481px]:max-[640px]:top-auto min-[481px]:max-[640px]:bottom-4 min-[481px]:max-[640px]:left-4 min-[481px]:max-[640px]:right-4 min-[481px]:max-[640px]:w-auto min-[481px]:max-[640px]:mt-0
                          /* Tablet and desktop positioning */
                          sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:left-auto sm:bottom-auto sm:transform-none">
            <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Active Users ({activeCount})
                </h3>
                {/* Close button for mobile */}
                <button
                  onClick={() => setShowUsersList(false)}
                  className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
            </div>
            
            <div className="max-h-64 sm:max-h-72 md:max-h-80 overflow-y-auto overscroll-contain">
              {activeUsers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activeUsers.map((user) => (
                    <div key={user.roll} className="px-3 sm:px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100 dark:active:bg-gray-600/50">
                      <div className="flex items-center gap-2 sm:gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold relative">
                            {user.name.charAt(0).toUpperCase()}
                            {/* Online/Grace period indicator with session validation */}
                            {user.isOnline ? (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
                            ) : user.isInGracePeriod ? (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
                            ) : (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          
                          {/* User info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {user.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="sm:hidden">#{user.roll}</span>
                              <span className="hidden sm:inline">Roll: {user.roll}</span>
                              {user.timestamp && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {formatTimeAgo(user.timestamp)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>                        {/* Status with session info */}
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            {user.isOnline ? (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 dark:text-green-400 hidden sm:inline font-medium">
                                  Online
                                </span>
                              </>
                            ) : user.isInGracePeriod ? (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 hidden sm:inline font-medium">
                                  Away
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline font-medium">
                                  Offline
                                </span>
                              </>
                            )}
                          </div>
                          {user.sessionId && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline">
                              Session active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="fas fa-user-slash text-xl sm:text-2xl mb-2 opacity-50"></i>
                  <p className="text-xs sm:text-sm">No active users at the moment</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block">
                    Users will appear here when they visit the platform
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActiveUsersIndicator;
