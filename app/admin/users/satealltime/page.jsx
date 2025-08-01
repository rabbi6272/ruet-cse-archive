'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { presenceTracker, useActiveUsers, formatTimeAgo, useAllUsersActivity } from '@/lib/presence-tracker';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Authorized admin users
const AUTHORIZED_ADMINS = ['2403142', '2403172', '2403129'];

export default function UserActivityTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [allUserSessions, setAllUserSessions] = useState([]);
  const [allUserActivity, setAllUserActivity] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active'); // 'active', 'sessions', 'history', 'activity'
  const router = useRouter();

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/user/login');
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Check if user is authorized admin
        if (AUTHORIZED_ADMINS.includes(user.roll)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/user/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Get active users and activity data
  useEffect(() => {
    if (!isAuthorized) return;

    // Get active users
    const unsubscribeActiveUsers = useActiveUsers((users) => {
      setActiveUsers(users);
    });

    // Get all user activity
    const unsubscribeActivity = useAllUsersActivity((activities) => {
      setAllUserActivity(activities);
    });

    return () => {
      if (unsubscribeActiveUsers) unsubscribeActiveUsers();
      if (unsubscribeActivity) unsubscribeActivity();
    };
  }, [isAuthorized]);

  // Get all user sessions and presence history
  useEffect(() => {
    if (!isAuthorized) return;

    const sessionsRef = ref(db, 'activeSessions');
    const presenceRef = ref(db, 'presence');

    // Listen to all sessions
    const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
      const sessionsData = snapshot.val() || {};
      const sessionsList = Object.entries(sessionsData).map(([roll, session]) => ({
        roll,
        ...session,
        type: 'session'
      }));
      setAllUserSessions(sessionsList);
    });

    return () => {
      unsubscribeSessions();
    };
  }, [isAuthorized]);

  const getStatusColor = (user) => {
    if (user.isOnline) return 'text-green-500';
    if (user.isInGracePeriod) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusText = (user) => {
    if (user.isOnline) return 'Online';
    if (user.isInGracePeriod) return 'Recently Active';
    return 'Offline';
  };

  const formatSessionDuration = (startTime, endTime) => {
    if (!startTime) return 'Unknown';
    
    try {
      let start = startTime;
      let end = endTime || Date.now();
      
      if (typeof startTime === 'object' && startTime.seconds) {
        start = startTime.seconds * 1000;
      }
      if (typeof endTime === 'object' && endTime.seconds) {
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
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You are not authorized to view this page. Only specific administrators can access user activity tracking.
          </p>
          <button
            onClick={() => router.push('/user/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Activity Tracker</h1>
              <p className="text-sm text-gray-600">Monitor real-time user presence and activity</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Admin: {currentUser?.name}</p>
              <p className="text-xs text-gray-500">Roll: {currentUser?.roll}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Currently Active ({activeUsers.length})
              </button>
              <button
                onClick={() => setSelectedTab('sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Sessions ({allUserSessions.length})
              </button>
              <button
                onClick={() => setSelectedTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity Log ({allUserActivity.length})
              </button>
            </nav>
          </div>

          {/* Active Users Tab */}
          {selectedTab === 'active' && (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Currently Active Users</h2>
                <p className="text-sm text-gray-600">Users who are currently online or recently active (within 2 minutes)</p>
              </div>
              
              {activeUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">👤</div>
                  <p className="text-gray-500">No users currently active</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeUsers.map((user) => (
                    <div key={user.roll} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)} bg-opacity-10`}>
                          {getStatusText(user)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Roll: {user.roll}</p>
                        <p>Last Seen: {formatTimeAgo(user.lastSeen)}</p>
                        <p>Current Page: {user.currentPage || 'Unknown'}</p>
                        <p>Session ID: {user.sessionId?.slice(-8) || 'Unknown'}</p>
                        {user.connectedAt && (
                          <p>Connected: {formatTimeAgo(user.connectedAt)}</p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          user.isOnline ? 'bg-green-500' : 
                          user.isInGracePeriod ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span className={`text-xs ${getStatusColor(user)}`}>
                          {user.isOnline ? 'Active Now' : 
                           user.isInGracePeriod ? 'Grace Period' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Sessions Tab */}
          {selectedTab === 'sessions' && (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All User Sessions</h2>
                <p className="text-sm text-gray-600">Complete history of user sessions and activity</p>
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
                          const aTime = a.lastActivity?.seconds ? a.lastActivity.seconds * 1000 : 0;
                          const bTime = b.lastActivity?.seconds ? b.lastActivity.seconds * 1000 : 0;
                          return bTime - aTime; // Most recent first
                        })
                        .map((session, index) => (
                        <tr key={`${session.roll}-${session.sessionId}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.roll}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.status === 'active' ? 'bg-green-100 text-green-800' :
                              session.status === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
                              session.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {session.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(session.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatSessionDuration(session.startTime, session.endTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.currentPage || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(session.lastActivity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {session.sessionId?.slice(-8) || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Activity Log Tab */}
          {selectedTab === 'activity' && (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">User Activity Log</h2>
                <p className="text-sm text-gray-600">Complete log of all user activities including page navigation and session events</p>
              </div>
              
              {allUserActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <p className="text-gray-500">No activity data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Agent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUserActivity.slice(0, 100).map((activity, index) => (
                        <tr key={`${activity.id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {activity.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.userRoll}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              activity.action === 'session_start' ? 'bg-green-100 text-green-800' :
                              activity.action === 'page_navigation' ? 'bg-blue-100 text-blue-800' :
                              activity.action === 'session_end' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.action === 'session_start' ? 'Login' :
                               activity.action === 'page_navigation' ? 'Navigation' :
                               activity.action === 'session_end' ? 'Logout' :
                               activity.action || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            <span title={activity.page}>
                              {activity.page || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {activity.sessionId?.slice(-8) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            <span title={activity.userAgent}>
                              {activity.userAgent ? 
                                activity.userAgent.split(' ')[0] + '...' : 
                                'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allUserActivity.length > 100 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Showing latest 100 activities out of {allUserActivity.length} total
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
