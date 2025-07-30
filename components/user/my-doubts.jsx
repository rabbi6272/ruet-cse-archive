"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const MyDoubts = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [resolvedDoubts, setResolvedDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadUserDoubts(parsedUser.roll);
    }
  }, [router]);

  const loadUserDoubts = (userRoll) => {
    setLoading(true);
    
    // Load pending/assigned doubts
    const doubtsRef = ref(db, "doubts");
    const userDoubtsQuery = query(
      doubtsRef,
      orderByChild("userDetails/roll"),
      equalTo(userRoll)
    );
    
    onValue(userDoubtsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const doubtsArray = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setDoubts(doubtsArray);
      } else {
        setDoubts([]);
      }
    });

    // Load resolved doubts
    const resolvedDoubtsRef = ref(db, "resolvedDoubts");
    const userResolvedQuery = query(
      resolvedDoubtsRef,
      orderByChild("userDetails/roll"),
      equalTo(userRoll)
    );
    
    onValue(userResolvedQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const resolvedArray = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => (b.solution?.solvedAt || b.timestamp) - (a.solution?.solvedAt || a.timestamp));
        setResolvedDoubts(resolvedArray);
      } else {
        setResolvedDoubts([]);
      }
      setLoading(false);
    });
  };

  const markAsSatisfied = async (doubtId) => {
    try {
      const response = await fetch("/api/doubt-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_satisfied",
          doubtId: doubtId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Thank you for your feedback! This doubt has been archived.");
      } else {
        toast.error("Failed to mark as satisfied. Please try again.");
      }
    } catch (error) {
      console.error("Error marking doubt as satisfied:", error);
      toast.error("Failed to mark as satisfied. Please try again.");
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Environment bug": "bg-red-100 text-red-800",
      "Code not running": "bg-orange-100 text-orange-800",
      "Compiler error": "bg-yellow-100 text-yellow-800",
      "Debug my code": "bg-blue-100 text-blue-800",
      "Give me hint": "bg-green-100 text-green-800",
      "Explain the idea": "bg-purple-100 text-purple-800",
      "Explain the code": "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      "pending": "bg-yellow-100 text-yellow-800",
      "assigned": "bg-blue-100 text-blue-800",
      "resolved": "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Doubts</h1>
          <p className="text-gray-600">Track your submitted doubts and their solutions</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending ({doubts.length})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resolved"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Resolved ({resolvedDoubts.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Loading your doubts...</div>
          </div>
        ) : (
          <>
            {/* Pending Doubts Tab */}
            {activeTab === "pending" && (
              <div className="space-y-6">
                {doubts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No pending doubts</h2>
                    <p className="text-gray-500 mb-4">You haven't submitted any doubts yet.</p>
                    <Link
                      href="/user/help"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Submit a Doubt
                    </Link>
                  </div>
                ) : (
                  doubts.map((doubt) => (
                    <div key={doubt.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{doubt.title}</h3>
                          <div className="flex gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doubt.category)}`}>
                              {doubt.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doubt.status)}`}>
                              {doubt.status === "pending" ? "Waiting for reviewer" : 
                               doubt.status === "assigned" ? `Assigned to ${doubt.assignedTo?.name}` : 
                               "Resolved"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Submitted: {formatDate(doubt.timestamp)}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{doubt.description}</p>

                      {doubt.attachment && (
                        <div className="mb-4 p-3 bg-gray-50 border rounded">
                          <p className="text-sm font-medium text-gray-700">
                            📎 Attachment: {doubt.attachment.name}
                          </p>
                        </div>
                      )}

                      {doubt.status === "assigned" && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Good news!</strong> Your doubt has been assigned to {doubt.assignedTo?.name}. 
                            They are working on solving it. You'll be notified when a solution is ready.
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Resolved Doubts Tab */}
            {activeTab === "resolved" && (
              <div className="space-y-6">
                {resolvedDoubts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No resolved doubts</h2>
                    <p className="text-gray-500">Your resolved doubts will appear here.</p>
                  </div>
                ) : (
                  resolvedDoubts.map((doubt) => (
                    <div key={doubt.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{doubt.title}</h3>
                          <div className="flex gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doubt.category)}`}>
                              {doubt.category}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Solved
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Solved: {formatDate(doubt.solution?.solvedAt)}
                        </div>
                      </div>

                      {/* Problem */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Your Problem:</h4>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-gray-700">{doubt.description}</p>
                        </div>
                      </div>

                      {/* Solution */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">
                          Solution by {doubt.solution?.solvedBy?.name}:
                        </h4>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-gray-700 whitespace-pre-wrap">{doubt.solution?.content}</p>
                          
                          {/* Solution Attachments */}
                          {doubt.solution?.attachments && doubt.solution.attachments.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-600 mb-2">Attachments:</h5>
                              <div className="grid grid-cols-1 gap-2">
                                {doubt.solution.attachments.map((attachment, index) => (
                                  <div key={index} className="border rounded p-2 bg-white">
                                    {attachment.type === 'image' ? (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">{attachment.name}</p>
                                        <img 
                                          src={attachment.data} 
                                          alt={attachment.name}
                                          className="max-w-full h-auto max-h-64 rounded cursor-pointer hover:opacity-80"
                                          onClick={() => window.open(attachment.data, '_blank')}
                                        />
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">{attachment.name}</p>
                                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                          <code>{attachment.content}</code>
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!doubt.userSatisfied && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => markAsSatisfied(doubt.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                          >
                            I am satisfied ✓
                          </button>
                          <p className="text-sm text-gray-600 py-2">
                            Mark as satisfied to add this doubt to the public archive for others to learn from.
                          </p>
                        </div>
                      )}

                      {doubt.userSatisfied && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <span className="bg-green-100 px-2 py-1 rounded">✓ Satisfied</span>
                            <span>This doubt has been added to the public archive.</span>
                            <Link 
                              href="/all/doubts" 
                              className="text-blue-600 hover:underline"
                            >
                              View in archive
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyDoubts;
