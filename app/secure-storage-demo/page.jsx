"use client";

import React, { useState, useEffect } from "react";
import { secureStorage } from "@/lib/secure-storage";
import AuthUtils from "@/lib/auth-utils-secure";

const SecureStorageDemo = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [testData, setTestData] = useState({
    roll: "2403142",
    name: "BITTO SAHA",
    expiry: new Date().getTime() + 24 * 60 * 60 * 1000
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = () => setLogs([]);

  useEffect(() => {
    updateStorageInfo();
  }, []);

  const updateStorageInfo = () => {
    try {
      const info = AuthUtils.getStorageInfo();
      setStorageInfo(info);
      addLog("Storage info updated", "success");
    } catch (error) {
      addLog(`Error updating storage info: ${error.message}`, "error");
    }
  };

  const handleStoreSecurely = async () => {
    setIsLoading(true);
    addLog("🔐 Storing data securely...", "info");
    
    try {
      // Show original data format (insecure)
      addLog(`📦 Original data (INSECURE): ${JSON.stringify(testData)}`, "warning");
      
      const success = secureStorage.setSecureUserData(testData);
      
      if (success) {
        addLog("✅ Data stored securely!", "success");
        
        // Show what's actually stored in localStorage
        const storedKeys = Object.keys(localStorage).filter(key => 
          key.includes('ss_') || key.includes(secureStorage.customHash('key_mapping'))
        );
        
        storedKeys.forEach(key => {
          const value = localStorage.getItem(key);
          addLog(`🔑 Stored key: ${key.substring(0, 20)}...`, "info");
          addLog(`🔒 Hashed value: ${value.substring(0, 50)}...`, "info");
        });
        
      } else {
        addLog("❌ Failed to store data securely", "error");
      }
      
      updateStorageInfo();
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, "error");
    }
    
    setIsLoading(false);
  };

  const handleRetrieveSecurely = async () => {
    setIsLoading(true);
    addLog("🔓 Retrieving data securely...", "info");
    
    try {
      const userData = secureStorage.getSecureUserData();
      
      if (userData) {
        addLog("✅ Data retrieved successfully!", "success");
        addLog(`📋 Retrieved data: ${JSON.stringify(userData)}`, "success");
      } else {
        addLog("❌ No secure data found", "error");
      }
      
      updateStorageInfo();
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, "error");
    }
    
    setIsLoading(false);
  };

  const handleUseAuthUtils = async () => {
    setIsLoading(true);
    addLog("🛡️ Testing AuthUtils...", "info");
    
    try {
      // Store data using AuthUtils
      const success = AuthUtils.setUserData(testData);
      if (success) {
        addLog("✅ Data stored via AuthUtils", "success");
      }
      
      // Retrieve data using AuthUtils
      const userData = AuthUtils.getUserData();
      if (userData) {
        addLog(`📋 AuthUtils retrieved: ${JSON.stringify(userData)}`, "success");
      }
      
      // Check authentication status
      const isAuth = AuthUtils.isAuthenticated();
      addLog(`🔍 Is authenticated: ${isAuth}`, isAuth ? "success" : "warning");
      
      // Check if admin
      const isAdmin = AuthUtils.isAdmin();
      addLog(`👑 Is admin: ${isAdmin}`, isAdmin ? "success" : "info");
      
      updateStorageInfo();
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, "error");
    }
    
    setIsLoading(false);
  };

  const handleCompareStorage = () => {
    addLog("📊 Comparing storage methods...", "info");
    
    // Show insecure storage
    const insecureData = JSON.stringify(testData);
    addLog(`🚨 INSECURE localStorage: ${insecureData}`, "warning");
    addLog(`📏 Insecure size: ${insecureData.length} characters`, "warning");
    
    // Show secure storage
    const secureKeys = Object.keys(localStorage).filter(key => 
      key.includes('ss_') || key.includes(secureStorage.customHash('key_mapping'))
    );
    
    if (secureKeys.length > 0) {
      secureKeys.forEach(key => {
        const value = localStorage.getItem(key);
        addLog(`🔐 SECURE key: ${key}`, "success");
        addLog(`🔒 SECURE value: ${value}`, "success");
        addLog(`📏 Secure size: ${value.length} characters`, "success");
      });
    }
  };

  const handleClearAll = () => {
    secureStorage.clearSecureData();
    localStorage.removeItem("user"); // Clear legacy data too
    addLog("🧹 All data cleared", "info");
    updateStorageInfo();
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      default: return "ℹ️";
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "success": return "text-green-600 dark:text-green-400";
      case "error": return "text-red-600 dark:text-red-400";
      case "warning": return "text-yellow-600 dark:text-yellow-400";
      default: return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🔐 Secure Storage Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See how your sensitive data is transformed from plain text to secure hashes, 
            protecting against manipulation in localStorage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            
            {/* Test Data Input */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Test Data
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={testData.roll}
                    onChange={(e) => setTestData({...testData, roll: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={testData.name}
                    onChange={(e) => setTestData({...testData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry (timestamp)
                  </label>
                  <input
                    type="number"
                    value={testData.expiry}
                    onChange={(e) => setTestData({...testData, expiry: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Actions
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleStoreSecurely}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔐 Store Securely
                </button>
                
                <button
                  onClick={handleRetrieveSecurely}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔓 Retrieve Securely
                </button>
                
                <button
                  onClick={handleUseAuthUtils}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🛡️ Test AuthUtils
                </button>
                
                <button
                  onClick={handleCompareStorage}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 Compare Methods
                </button>
                
                <button
                  onClick={handleClearAll}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2"
                >
                  🧹 Clear All Data
                </button>
              </div>
            </div>

            {/* Storage Info */}
            {storageInfo && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Storage Status
                </h2>
                
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 ${storageInfo.isAuthenticated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <span className="text-lg">{storageInfo.isAuthenticated ? '✅' : '❌'}</span>
                    <span className="font-medium">Authenticated: {storageInfo.isAuthenticated.toString()}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${storageInfo.hasSecureData ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="text-lg">{storageInfo.hasSecureData ? '🔐' : '📝'}</span>
                    <span className="font-medium">Secure Data: {storageInfo.hasSecureData.toString()}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${storageInfo.hasLegacyData ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="text-lg">{storageInfo.hasLegacyData ? '⚠️' : '✅'}</span>
                    <span className="font-medium">Legacy Data: {storageInfo.hasLegacyData.toString()}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${storageInfo.sessionValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <span className="text-lg">{storageInfo.sessionValid ? '🕐' : '⏰'}</span>
                    <span className="font-medium">Session Valid: {storageInfo.sessionValid.toString()}</span>
                  </div>
                  
                  {storageInfo.userRoll && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <span className="text-lg">👤</span>
                      <span className="font-medium">User Roll: {storageInfo.userRoll}</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Keys ({storageInfo.storageKeys.length}):</p>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {storageInfo.storageKeys.map((key, index) => (
                        <div key={index} className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                          {key.length > 50 ? `${key.substring(0, 50)}...` : key}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Activity Logs
                </h2>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="h-96 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <span className="text-4xl mb-2 block">📝</span>
                    No logs yet. Try performing some actions!
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-lg flex-shrink-0">
                        {getLogIcon(log.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${getLogColor(log.type)}`}>
                          {log.message}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {log.timestamp}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">🔒 Security Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-bold mb-2">Custom Hashing</h3>
              <p className="text-sm opacity-90">
                Uses a custom SHA-256-like algorithm with multiple rounds for enhanced security.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🧂</div>
              <h3 className="font-bold mb-2">Salt Protection</h3>
              <p className="text-sm opacity-90">
                Adds salt to prevent rainbow table attacks and ensure unique hashes.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-bold mb-2">Key Obfuscation</h3>
              <p className="text-sm opacity-90">
                Both keys and values are hashed, making it impossible to identify data structure.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-bold mb-2">Integrity Checks</h3>
              <p className="text-sm opacity-90">
                Built-in verification to detect tampering or corruption of stored data.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🔀</div>
              <h3 className="font-bold mb-2">Reversible Encryption</h3>
              <p className="text-sm opacity-90">
                Enhanced version supports encryption for data retrieval while maintaining security.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">🕐</div>
              <h3 className="font-bold mb-2">Session Management</h3>
              <p className="text-sm opacity-90">
                Automatic expiry handling and session validation for enhanced security.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-lg font-medium opacity-95">
              Your data is now protected against client-side manipulation! 🛡️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureStorageDemo;
