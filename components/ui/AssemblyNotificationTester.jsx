"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';

const AssemblyNotificationTester = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const testAction = async (action, actionName) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-assembly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ ${actionName} completed successfully!`);
        console.log(`${actionName} result:`, result);
      } else {
        toast.error(`❌ ${actionName} failed: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error(`${actionName} error:`, error);
      toast.error(`❌ ${actionName} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    const result = await testAction('check_status', 'Status Check');
    if (result?.success) {
      setStatus(result.status);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center">
        <span className="mr-2">🧪</span>
        Assembly Notification Tester
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <button
          onClick={() => testAction('test_send', 'Test Send')}
          disabled={loading}
          className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          🚀 Test Send
        </button>
        
        <button
          onClick={checkStatus}
          disabled={loading}
          className="text-xs px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          📊 Check Status
        </button>
        
        <button
          onClick={() => testAction('manage', 'Auto Manage')}
          disabled={loading}
          className="text-xs px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          🔄 Auto Manage
        </button>
        
        <button
          onClick={() => testAction('clear_all', 'Clear All')}
          disabled={loading}
          className="text-xs px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          🧹 Clear All
        </button>
      </div>

      {status && (
        <div className="text-xs bg-white dark:bg-gray-800 rounded p-2 border">
          <strong>Current Status:</strong>
          <br />
          Unsolved Doubts: {status.unsolvedDoubts ? '✅ Yes' : '❌ No'}
          <br />
          Assembly Notification: {status.assemblyNotificationExists ? '✅ Exists' : '❌ None'}
        </div>
      )}

      {loading && (
        <div className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border border-yellow-600 border-t-transparent mr-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default AssemblyNotificationTester;
