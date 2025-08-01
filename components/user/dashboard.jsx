"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  update,
  remove,
} from "firebase/database";
import { isAuthorizedReviewer, getUserDisplayRole } from "@/lib/auth-utils";
import toast, { Toaster } from "react-hot-toast";
import NotificationCenter from "./NotificationCenter";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";
import {
  getUserNutrinos,
  recordDailyVisit,
  awardSnippetNutrinos,
  getUserNutrinosHistory,
} from "@/lib/nutrinos-system";
import { presenceTracker } from "@/lib/presence-tracker";
import ActiveUsersIndicator from "@/components/ui/ActiveUsersIndicator";

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [isCodeReviewer, setIsCodeReviewer] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [userNutrinos, setUserNutrinos] = useState({
    totalNutrinos: 0,
    rank: "Newbie",
    level: 1,
  });
  const [nutrinosHistory, setNutrinosHistory] = useState([]);
  const [showNutrinosHistory, setShowNutrinosHistory] = useState(false);
  const [unsolvedDoubtsCount, setUnsolvedDoubtsCount] = useState(0);

  const maxCodeLines = 20;

  // Check authentication and load user data
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsCodeReviewer(isAuthorizedReviewer(parsedUser));
      loadUserSnippets(parsedUser.roll);
      loadUserNutrinosData(parsedUser.roll);
      // Load unsolved doubts count for all users
      loadUnsolvedDoubtsCount();
      // Record daily visit for Nutrinos
      recordDailyVisit(parsedUser.roll);
      // Start tracking user presence
      presenceTracker.startTracking(parsedUser.roll, parsedUser.name);
    }

    // Cleanup presence tracking when component unmounts
    return () => {
      presenceTracker.stopTracking();
    };
  }, [router]);

  // Load user's Nutrinos data
  const loadUserNutrinosData = async (rollNumber) => {
    try {
      const nutrinosData = await getUserNutrinos(rollNumber);
      setUserNutrinos(nutrinosData);

      const history = await getUserNutrinosHistory(rollNumber, 5);
      setNutrinosHistory(history);
    } catch (error) {
      console.error("Error loading Nutrinos data:", error);
    }
  };

  // Load unsolved doubts count for reviewers
  const loadUnsolvedDoubtsCount = () => {
    try {
      const doubtsRef = ref(db, "doubts");
      onValue(doubtsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const unsolvedCount = Object.keys(data)
            .filter((key) => {
              const doubt = data[key];
              return doubt.status === "pending" || doubt.status === "assigned";
            })
            .length;
          setUnsolvedDoubtsCount(unsolvedCount);
        } else {
          setUnsolvedDoubtsCount(0);
        }
      });
    } catch (error) {
      console.error("Error loading unsolved doubts count:", error);
      setUnsolvedDoubtsCount(0);
    }
  };

  // Highlight code blocks after component renders
  useEffect(() => {
    const codeBlocks = document.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  }, [snippets, editingId]);

  // Load user's snippets from Firebase
  const loadUserSnippets = (rollNumber) => {
    setLoading(true);
    try {
      const snippetsRef = ref(db, "codeSnippets");
      const userSnippetsQuery = query(
        snippetsRef,
        orderByChild("rollNumber"),
        equalTo(rollNumber)
      );

      onValue(userSnippetsQuery, (snapshot) => {
        const snippetsData = snapshot.val() || {};
        const snippetsArray = Object.entries(snippetsData).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        );
        // Sort by date (newest first)
        snippetsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSnippets(snippetsArray);
        setLoading(false);
      });
    } catch (err) {
      setError("Failed to load snippets. Please try again.");
      setLoading(false);
      console.error("Error loading snippets:", err);
    }
  };

  // Handle edit button click
  const handleEditClick = (snippet) => {
    setEditingId(snippet.id);
    setEditForm({
      title: snippet.title,
      description: snippet.description,
      codeSnippet: snippet.codeSnippet,
    });
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save edited snippet
  const handleSaveEdit = async (snippetId) => {
    try {
      const snippetRef = ref(db, `codeSnippets/${snippetId}`);
      await update(snippetRef, {
        title: editForm.title,
        description: editForm.description,
        codeSnippet: editForm.codeSnippet,
        lastUpdated: new Date().toISOString(),
      });
      setEditingId(null);

      // Award Nutrinos for editing snippet
      await awardSnippetNutrinos.edit(user.roll, snippetId);

      // Refresh Nutrinos data
      await loadUserNutrinosData(user.roll);

      toast.success("Snippet updated successfully! +1.5 Nutrinos earned!");
    } catch (err) {
      setError("Failed to update snippet. Please try again.");
      toast.error("Failed to update snippet. Please try again.");
      console.error("Error updating snippet:", err);
    }
  };

  // Delete snippet
  const handleDeleteSnippet = async (snippetId) => {
    if (
      confirm(
        "Are you sure you want to delete this snippet? You will lose 3 Nutrinos."
      )
    ) {
      try {
        const snippetRef = ref(db, `codeSnippets/${snippetId}`);
        await remove(snippetRef);

        // Award negative Nutrinos for deleting snippet
        await awardSnippetNutrinos.delete(user.roll, snippetId);

        // Refresh Nutrinos data
        await loadUserNutrinosData(user.roll);

        toast.success("Snippet deleted successfully! -3 Nutrinos deducted.");
      } catch (err) {
        setError("Failed to delete snippet. Please try again.");
        toast.error("Failed to delete snippet. Please try again.");
        console.error("Error deleting snippet:", err);
      }
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
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

  // Pagination logic
  const totalPages = Math.ceil(snippets.length / ITEMS_PER_PAGE);
  const paginatedSnippets = snippets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading user data...</p>
      </div>
    );
  }

  const handleNewSnippet = () => {
    router.push("/user/create"); // Or your new snippet creation route
  };

  return (
    <div className="min-h-screen py-4 px-4">
      <Toaster />
      <div className="w-full lg:max-w-6xl mx-auto">
        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 lg:p-6 mb-6">
          {/* Main Profile Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            {/* Left Section - User Info */}
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar */}
              <div className="flex-shrink-0 h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl lg:text-3xl font-bold shadow-lg">
                {user.name.charAt(0)}
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {user.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-id-badge text-blue-500"></i>
                    Roll: {user.roll}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-code text-green-500"></i>
                    {snippets.length} {snippets.length === 1 ? "snippet" : "snippets"}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {/* Role Badge */}
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                    <span>🛡️</span>
                    <span>{getUserDisplayRole(user)}</span>
                  </div>

                  {/* Rank Badge */}
                  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                    <span>🏆</span>
                    <span>{userNutrinos.rank}</span>
                  </div>

                  {/* Level Badge */}
                  <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                    <span>📊</span>
                    <span>Level {userNutrinos.level}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Active Users & Notifications */}
            <div className="flex flex-col lg:items-end gap-3 w-full lg:w-auto">
              {/* Mobile: Stack horizontally, Desktop: Stack vertically */}
              <div className="flex flex-row lg:flex-col items-start lg:items-end gap-3">
                <ActiveUsersIndicator showDetails={true} className="flex-shrink-0" />
                <NotificationCenter userRoll={user?.roll} />
              </div>
              <Link
                href="/user/notifications"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-1 self-start lg:self-end"
              >
                <i className="fas fa-external-link-alt text-xs"></i>
                <span>View all notifications</span>
              </Link>
            </div>
          </div>

          {/* Nutrinos Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Nutrinos Display */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg">
                  <span className="text-lg">⚡</span>
                  <div className="text-left">
                    <div className="text-xs opacity-90">Total Nutrinos</div>
                    <div className="text-lg font-bold">{userNutrinos.totalNutrinos.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Current Progress</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {userNutrinos.rank} • Level {userNutrinos.level}
                  </div>
                </div>
              </div>

              {/* History Button */}
              <button
                onClick={() => setShowNutrinosHistory(!showNutrinosHistory)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2"
              >
                <i className="fas fa-history"></i>
                <span>Activity History</span>
              </button>
            </div>
          </div>

          {/* Nutrinos History Dropdown */}
          {showNutrinosHistory && (
            <div className="relative mb-6">
              <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Recent Nutrinos Activity
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {nutrinosHistory.length > 0 ? (
                    nutrinosHistory.map((entry) => (
                      <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {typeof entry.reason === "string"
                                ? entry.reason
                                : "Activity completed"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-bold px-2 py-1 rounded ${
                              entry.nutrinos >= 0
                                ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                : "text-red-600 bg-red-100 dark:bg-red-900/30"
                            }`}
                          >
                            {entry.nutrinos >= 0 ? "+" : ""}
                            {entry.nutrinos.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <i className="fas fa-inbox text-2xl mb-2 opacity-50"></i>
                      <p className="text-sm">No Nutrinos activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Overlay to close Nutrinos history when clicking outside */}
          {showNutrinosHistory && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNutrinosHistory(false)}
            />
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleNewSnippet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105"
              >
                <i className="fas fa-plus text-sm"></i>
                <span className="hidden sm:inline text-sm font-medium">Add Codesnippet</span>
                <span className="sm:hidden text-sm font-medium">Add</span>
              </button>

              <Link
                href="/contact&help/help"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105"
              >
                <i className="fas fa-question-circle text-sm"></i>
                <span className="hidden sm:inline text-sm font-medium">Ask Help</span>
                <span className="sm:hidden text-sm font-medium">Help</span>
              </Link>

              <Link
                href="/user/my-doubts"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105"
              >
                <i className="fas fa-list text-sm"></i>
                <span className="hidden sm:inline text-sm font-medium">My Doubts</span>
                <span className="sm:hidden text-sm font-medium">Doubts</span>
              </Link>

              {/* Solve Doubts Button - Available for all users */}
              <Link
                href="/reviewers/dashboard"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-105 relative"
              >
                <i className="fas fa-clipboard-check text-sm"></i>
                <span className="hidden sm:inline text-sm font-medium">Solve Doubts</span>
                <span className="sm:hidden text-sm font-medium">Solve</span>
                {/* Unsolved doubts count badge */}
                {unsolvedDoubtsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                    {unsolvedDoubtsCount > 99 ? '99+' : unsolvedDoubtsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Snippets Section */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
          {/* Snippets Header */}
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Code Snippets
            </h2>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : snippets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <i className="fas fa-code text-3xl"></i>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No code snippets yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start by posting your first snippet!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSnippets.map((snippet) => (
                <div key={snippet.id} className="p-4 lg:p-6">
                  {editingId === snippet.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Code
                        </label>
                        <textarea
                          name="codeSnippet"
                          value={editForm.codeSnippet}
                          onChange={handleEditChange}
                          rows="20"
                          className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveEdit(snippet.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Snippet Display
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {snippet.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                              {snippet.language}
                            </span>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                              {snippet.difficulty}
                            </span>
                            <span className="text-xs">
                              {new Date(snippet.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 self-start">
                          <button
                            onClick={() => handleEditClick(snippet)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Delete
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                        {snippet.description}
                      </p>

                      <div className="code-container bg-gray-900 rounded-xl overflow-hidden relative group">
                        {/* Code snippet */}
                        <pre
                          className={`p-4 overflow-x-auto transition-transform duration-500 ${
                            isCodeLong(snippet.codeSnippet) &&
                            !expandedSnippets[snippet.id]
                              ? "max-h-90"
                              : ""
                          }`}
                        >
                          <code
                            className={`language-${
                              snippet.language?.toLowerCase() || "text"
                            }`}
                          >
                            {isCodeLong(snippet.codeSnippet) &&
                            !expandedSnippets[snippet.id]
                              ? snippet.codeSnippet
                                  .split("\n")
                                  .slice(0, maxCodeLines)
                                  .join("\n") + "\n..."
                              : snippet.codeSnippet}
                          </code>
                        </pre>

                        {/* Code expand button */}
                        {isCodeLong(snippet.codeSnippet) && (
                          <div className="flex justify-center p-3">
                            <button
                              className="px-4 py-2 text-sm font-medium rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors shadow-sm"
                              onClick={() => {
                                // Remove highlighting before animation
                                const codeBlocks =
                                  document.querySelectorAll("pre code");
                                codeBlocks.forEach((block) => {
                                  block.removeAttribute("data-highlighted");
                                  block.className = block.className
                                    .replace(/hljs[^\s]*/g, "")
                                    .trim();
                                });
                                toggleExpand(snippet.id);
                              }}
                            >
                              {expandedSnippets[snippet.id]
                                ? "Collapse"
                                : "Expand"}{" "}
                              Code
                            </button>
                          </div>
                        )}
                      </div>

                      {snippet.tags && snippet.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {snippet.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {snippets.length > ITEMS_PER_PAGE && (
            <div className="px-4 lg:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, snippets.length)}
                    </span>{" "}
                    of <span className="font-medium">{snippets.length}</span>{" "}
                    snippets
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <i className="fas fa-chevron-left mr-1"></i>
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Next
                    <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
