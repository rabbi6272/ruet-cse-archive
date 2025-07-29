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
import toast, { Toaster } from "react-hot-toast";
import NotificationCenter from "./NotificationCenter";

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

  // Check authentication and load user data
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadUserSnippets(parsedUser.roll);
    }
  }, [router]);

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
      toast.success("Snippet updated successfully!");
    } catch (err) {
      setError("Failed to update snippet. Please try again.");
      toast.error("Failed to update snippet. Please try again.");
      console.error("Error updating snippet:", err);
    }
  };

  // Delete snippet
  const handleDeleteSnippet = async (snippetId) => {
    if (confirm("Are you sure you want to delete this snippet?")) {
      try {
        const snippetRef = ref(db, `codeSnippets/${snippetId}`);
        await remove(snippetRef);
        toast.success("Snippet deleted successfully!");
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
    <div className="min-h-screen py-8 sm:px-4 lg:px-6">
      <Toaster />
      <div className="max-w-[95%] lg:max-w-5xl mx-auto">
        {/* User Profile Section */}
        <div className="bg-white dark:bg-slate-700 shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-300 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                  {user.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Roll Number: {user.roll}
                </p>
                <p className="text-gray-600 dark:text-gray-400 ">
                  {snippets.length}{" "}
                  {snippets.length === 1 ? "snippet" : "snippets"} posted
                </p>
              </div>
            </div>
            
            {/* Notification Center */}
            <div className="relative">
              <NotificationCenter userRoll={user.roll} />
              {/* Additional visual indicator for notifications */}
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full opacity-0 notification-pulse"></div>
            </div>
          </div>

          <button
            onClick={handleNewSnippet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white my-4 px-6 py-2.5 rounded-lg shadow transition duration-200 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Post New Snippet
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Snippets Section */}
        <div className="bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-300 shadow rounded-lg overflow-hidden">
          {/* Snippets Header */}
          <div className="px-6 py-5 border-b border-gray-400 dark:border-gray-200">
            <h2 className="text-lg font-medium ">Your Code Snippets</h2>
          </div>

          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : snippets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You haven't posted any code snippets yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {paginatedSnippets.map((snippet) => (
                <li key={snippet.id} className="p-6">
                  {editingId === snippet.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code
                        </label>
                        <textarea
                          name="codeSnippet"
                          value={editForm.codeSnippet}
                          onChange={handleEditChange}
                          rows="20"
                          className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleSaveEdit(snippet.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Snippet Display
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300">
                            {snippet.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {snippet.language} • {snippet.difficulty} •{" "}
                            {new Date(snippet.date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(snippet)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        {snippet.description}
                      </p>
                      <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        <pre className="text-sm text-gray-900 dark:text-gray-300 overflow-x-auto">
                          <code>{snippet.codeSnippet}</code>
                        </pre>
                      </div>
                      {snippet.tags && snippet.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {snippet.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {snippets.length > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
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
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
