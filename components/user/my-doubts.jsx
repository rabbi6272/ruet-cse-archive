"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";
import AuthUtils from "@/lib/auth-utils-secure";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";

const MyDoubts = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [resolvedDoubts, setResolvedDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedSnippets, setExpandedSnippets] = useState({});

  const maxCodeLines = 20;

  useEffect(() => {
    // Check authentication using AuthUtils
    if (!AuthUtils.isAuthenticated()) {
      router.push("/user/login");
    } else {
      const userData = AuthUtils.getUserData();
      setUser(userData);
      loadUserDoubts(userData.roll);
    }
  }, [router]);

  useEffect(() => {
    // Highlight code blocks after component renders
    const codeBlocks = document.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  const loadUserDoubts = async (userRoll) => {
    setLoading(true);

    try {
      // Import Firebase dynamically to ensure client-side only
      const { db } = await import('@/lib/firebase');
      if (!db) {
        console.log('Database not available for loading user doubts');
        setLoading(false);
        return;
      }

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
            .map((key) => ({
              id: key,
              ...data[key],
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
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .sort(
              (a, b) =>
                (b.solution?.solvedAt || b.timestamp) -
                (a.solution?.solvedAt || a.timestamp)
            );
          setResolvedDoubts(resolvedArray);
        } else {
          setResolvedDoubts([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Failed to load user doubts:', error);
      setDoubts([]);
      setResolvedDoubts([]);
      setLoading(false);
    }
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
          userRoll: user.roll, // Add user roll for verification
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          "Thank you for your feedback! This doubt has been archived."
        );
      } else {
        toast.error("Failed to mark as satisfied. Please try again.");
      }
    } catch (error) {
      console.error("Error marking doubt as satisfied:", error);
      toast.error("Failed to mark as satisfied. Please try again.");
    }
  };

  const markAsNotSatisfied = async (doubtId) => {
    try {
      const response = await fetch("/api/doubt-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_not_satisfied",
          doubtId: doubtId,
          userRoll: user.roll, // Add user roll for verification
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          "Doubt reopened for further assistance. A reviewer will be notified."
        );
      } else {
        toast.error("Failed to reopen doubt. Please try again.");
      }
    } catch (error) {
      console.error("Error marking as not satisfied:", error);
      toast.error("Failed to reopen doubt. Please try again.");
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
      "Explain the code": "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const toggleExpand = (id) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    // Re-highlight after state change and DOM update
    setTimeout(() => {
      const codeBlocks = document.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        // Remove existing highlighting classes
        block.removeAttribute("data-highlighted");
        block.className = block.className.replace(/hljs[^\s]*/g, "").trim();
        // Re-apply highlighting
        hljs.highlightElement(block);
      });
    }, 100);
  };

  const isCodeLong = (code) => {
    return code?.split("\n").length > maxCodeLines;
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-4 sm:py-8 sm:px-4 lg:px-6">
      <Toaster />
      <div className="max-w-[95%] lg:max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            My Doubts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your submitted doubts and their solutions
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "pending"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
                }`}
              >
                Pending ({doubts.length})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "resolved"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
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
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Loading your doubts...
            </div>
          </div>
        ) : (
          <>
            {/* Pending Doubts Tab */}
            {activeTab === "pending" && (
              <div className="space-y-4 sm:space-y-6">
                {doubts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      No pending doubts
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      You haven't submitted any doubts yet.
                    </p>
                    <Link
                      href="/contact&help/help"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Submit a Doubt
                    </Link>
                  </div>
                ) : (
                  doubts.map((doubt) => (
                    <div
                      key={doubt.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-blue-500"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate pr-2">
                            {doubt.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                                doubt.category
                              )}`}
                            >
                              {doubt.category}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                doubt.status
                              )}`}
                            >
                              {doubt.status === "pending"
                                ? "Waiting for reviewer"
                                : doubt.status === "assigned"
                                ? `Assigned to ${doubt.assignedTo?.name}`
                                : "Resolved"}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                          Submitted: {formatDate(doubt.timestamp)}
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
                        {doubt.description}
                      </p>

                      {doubt.attachment && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            📎 Attachment: {doubt.attachment.name}
                          </p>
                        </div>
                      )}

                      {doubt.status === "assigned" && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Good news!</strong> Your doubt has been
                            assigned to {doubt.assignedTo?.name}. They are
                            working on solving it. You'll be notified when a
                            solution is ready.
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
              <div className="space-y-4 sm:space-y-6">
                {resolvedDoubts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      No resolved doubts
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Your resolved doubts will appear here.
                    </p>
                  </div>
                ) : (
                  resolvedDoubts.map((doubt) => (
                    <div
                      key={doubt.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-green-500"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate pr-2">
                            {doubt.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                                doubt.category
                              )}`}
                            >
                              {doubt.category}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Solved
                            </span>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                          Solved: {formatDate(doubt.solution?.solvedAt)}
                        </div>
                      </div>

                      {/* Problem */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your Problem:
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                            {doubt.description}
                          </p>
                        </div>
                      </div>

                      {/* Solution */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Solution by {doubt.solution?.solvedBy?.name}:
                        </h4>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm sm:text-base">
                            {doubt.solution?.content}
                          </p>

                          {/* Solution Attachments */}
                          {doubt.solution?.attachments &&
                            doubt.solution.attachments.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                  Attachments:
                                </h5>
                                <div className="grid grid-cols-1 gap-2">
                                  {doubt.solution.attachments.map(
                                    (attachment, index) => (
                                      <div
                                        key={index}
                                        className="border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800"
                                      >
                                        {attachment.type === "image" ? (
                                          <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                              {attachment.name}
                                            </p>
                                            <img
                                              src={attachment.data}
                                              alt={attachment.name}
                                              className="max-w-full h-auto max-h-48 sm:max-h-64 rounded cursor-pointer hover:opacity-80"
                                              onClick={() =>
                                                window.open(
                                                  attachment.data,
                                                  "_blank"
                                                )
                                              }
                                            />
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                              {attachment.name}
                                            </p>
                                            <div className="code-container bg-gray-900 rounded-lg overflow-hidden relative group">
                                              <pre
                                                className={`p-4 overflow-x-auto transition-transform duration-500 ${
                                                  isCodeLong(
                                                    attachment.content
                                                  ) &&
                                                  !expandedSnippets[
                                                    `${doubt.id}-${index}`
                                                  ]
                                                    ? "max-h-70"
                                                    : ""
                                                }`}
                                              >
                                                <code
                                                  className={`language-javascript`}
                                                >
                                                  {isCodeLong(
                                                    attachment.content
                                                  ) &&
                                                  !expandedSnippets[
                                                    `${doubt.id}-${index}`
                                                  ]
                                                    ? attachment.content
                                                        .split("\n")
                                                        .slice(0, maxCodeLines)
                                                        .join("\n") + "\n..."
                                                    : attachment.content}
                                                </code>
                                              </pre>

                                              {/* Code expand button */}
                                              {isCodeLong(
                                                attachment.content
                                              ) && (
                                                <div className="flex justify-center p-2">
                                                  <button
                                                    className="px-6 py-2 text-sm font-medium rounded-full mx-auto bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors duration-300"
                                                    onClick={() => {
                                                      // Remove highlighting before animation
                                                      const codeBlocks =
                                                        document.querySelectorAll(
                                                          "pre code"
                                                        );
                                                      codeBlocks.forEach(
                                                        (block) => {
                                                          block.removeAttribute(
                                                            "data-highlighted"
                                                          );
                                                          block.className =
                                                            block.className
                                                              .replace(
                                                                /hljs[^\s]*/g,
                                                                ""
                                                              )
                                                              .trim();
                                                        }
                                                      );
                                                      toggleExpand(
                                                        `${doubt.id}-${index}`
                                                      );
                                                    }}
                                                  >
                                                    {expandedSnippets[
                                                      `${doubt.id}-${index}`
                                                    ]
                                                      ? "Collapse "
                                                      : "Expand "}
                                                    Code
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!doubt.userSatisfied && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <button
                              onClick={() => markAsSatisfied(doubt.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-sm font-medium"
                            >
                              I am satisfied ✓
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Mark as satisfied to add this doubt to the public
                            archive.
                          </p>
                        </div>
                      )}

                      {doubt.userSatisfied && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded inline-block">
                              ✓ Satisfied
                            </span>
                            <span>
                              This doubt has been added to the public archive.
                            </span>
                            <Link
                              href="/all/doubts"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
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
