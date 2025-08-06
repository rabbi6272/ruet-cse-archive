"use client";

import { useState, useEffect } from "react";
import MessageReactions from "@/components/ui/MessageReactions";
import { db } from "@/lib/firebase";
import { ref, push, set, serverTimestamp } from "firebase/database";

export default function TestReactionsPage() {
  const [testMessages, setTestMessages] = useState([]);
  const currentUserRoll = "240340404"; // Test user roll
  const testChatPath = "testGroupMessages/demo";

  useEffect(() => {
    // Create some test messages
    const messages = [
      {
        id: "msg1",
        text: "Hey everyone! How's the group project going?",
        senderRoll: "240340405",
        senderName: "Alice Johnson",
        timestamp: Date.now() - 3600000, // 1 hour ago
        isOwnMessage: false
      },
      {
        id: "msg2", 
        text: "Working on it! Just finished the frontend design 🚀",
        senderRoll: currentUserRoll,
        senderName: "You",
        timestamp: Date.now() - 1800000, // 30 minutes ago
        isOwnMessage: true
      },
      {
        id: "msg3",
        text: "That looks amazing! Great work on the UI components.",
        senderRoll: "240340406",
        senderName: "Bob Smith", 
        timestamp: Date.now() - 900000, // 15 minutes ago
        isOwnMessage: false
      },
      {
        id: "msg4",
        text: "Thanks! Let me know if you need any help with the backend integration.",
        senderRoll: currentUserRoll,
        senderName: "You",
        timestamp: Date.now() - 300000, // 5 minutes ago
        isOwnMessage: true
      }
    ];
    setTestMessages(messages);

    // Initialize test data in Firebase (optional - for demonstration)
    const initializeTestData = async () => {
      try {
        messages.forEach(async (msg) => {
          const messageRef = ref(db, `${testChatPath}/messages/${msg.id}`);
          await set(messageRef, {
            text: msg.text,
            senderRoll: msg.senderRoll,
            senderName: msg.senderName,
            timestamp: serverTimestamp(),
          });
        });
      } catch (error) {
        console.log("Firebase not configured for demo");
      }
    };

    // Uncomment the line below if you want to initialize test data in Firebase
    // initializeTestData();
  }, []);

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Group Chat Reactions Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Reactions are now positioned at the bottom right edge with a single ❤️ container showing total count
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Improvements:</strong>
              <br />• Reactions always appear at bottom right edge
              <br />• Single heart emoji (❤️) container with total count
              <br />• Responsive panel on click to view all reactions
              <br />• Consistent positioning for both own and others' messages
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Group Chat - CSE Section C
            </h2>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {testMessages.map((message) => {
              const isOwnMessage = message.isOwnMessage;
              
              return (
                <div key={message.id} className="group relative">
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] px-3 py-2 rounded-2xl relative transition-transform duration-150 shadow-sm ${
                        isOwnMessage
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {/* Sender name for others' messages */}
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {message.senderName}
                          </p>
                        </div>
                      )}

                      {/* Message text */}
                      <p className={`text-sm sm:text-base break-words ${
                        isOwnMessage ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {message.text}
                      </p>

                      {/* Timestamp */}
                      <p className={`text-xs mt-1 ${
                        isOwnMessage 
                          ? 'text-indigo-200' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getRelativeTime(message.timestamp)}
                      </p>

                      {/* Message Reactions - positioned at bottom right corner of this message bubble */}
                      <MessageReactions
                        messageId={message.id}
                        chatPath={testChatPath}
                        currentUserRoll={currentUserRoll}
                        isOwnMessage={isOwnMessage}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Hover over messages to see reaction button</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              ✅ Implementation Complete
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-4">
              The emoji reaction system has been updated according to your specifications:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Reactions positioned at bottom right edge
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Single container with ❤️ emoji and total count
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Responsive panel opens on click
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-700 dark:text-green-300">
                  Consistent positioning for all message types
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
