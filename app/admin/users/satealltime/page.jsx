'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/lib/presence-tracker';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Authorized admin users
const AUTHORIZED_ADMINS = ['2403142', '2403172', '2403129'];

export default function UserActivityTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allUserSessions, setAllUserSessions] = useState([]);
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
              <h1 className="text-2xl font-bold text-gray-900">User Sessions Tracker</h1>
              <p className="text-sm text-gray-600">Complete history of user sessions and activity</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Admin: {currentUser?.name}</p>
              <p className="text-xs text-gray-500">Roll: {currentUser?.roll}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Sessions Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All User Sessions ({allUserSessions.length})</h2>
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
        </div>
      </div>
    </div>
  );
}
