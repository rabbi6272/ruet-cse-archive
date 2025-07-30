"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";

const DoubtsArchive = () => {
  const [doubts, setDoubts] = useState([]);
  const [filteredDoubts, setFilteredDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDoubt, setExpandedDoubt] = useState(null);
  const [expandedSnippets, setExpandedSnippets] = useState({});

  const ITEMS_PER_PAGE = 5;
  const maxCodeLines = 20;

  const categories = [
    "Environment bug",
    "Code not running",
    "Compiler error",
    "Debug my code",
    "Give me hint",
    "Explain the idea",
    "Explain the code",
  ];

  useEffect(() => {
    loadResolvedDoubts();
  }, []);

  useEffect(() => {
    filterDoubts();
  }, [doubts, searchQuery, selectedCategory]);

  useEffect(() => {
    // Highlight code blocks after component renders
    const codeBlocks = document.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  const loadResolvedDoubts = () => {
    setLoading(true);
    try {
      const resolvedDoubtsRef = ref(db, "resolvedDoubts");
      onValue(resolvedDoubtsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const doubtsArray = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .sort(
              (a, b) =>
                (b.solution?.solvedAt || b.timestamp) -
                (a.solution?.solvedAt || a.timestamp)
            );

          setDoubts(doubtsArray);
        } else {
          setDoubts([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading resolved doubts:", error);
      toast.error("Failed to load doubts archive");
      setLoading(false);
    }
  };

  const filterDoubts = () => {
    let filtered = doubts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doubt) =>
          doubt.title.toLowerCase().includes(query) ||
          doubt.description.toLowerCase().includes(query) ||
          doubt.solution?.content.toLowerCase().includes(query) ||
          doubt.userDetails.name.toLowerCase().includes(query) ||
          doubt.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (doubt) => doubt.category === selectedCategory
      );
    }

    setFilteredDoubts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
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

  // Pagination
  const totalPages = Math.ceil(filteredDoubts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDoubts = filteredDoubts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen py-8">
      <Toaster />
      <div className="w-full lg:max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Doubts Archive
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse through resolved coding doubts and solutions
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Box */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Search Doubts
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, solution, or coder name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {loading ? "Loading..." : `${filteredDoubts.length} doubts found`}
          </div>
        </div>

        {/* Doubts List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Loading doubts...
            </div>
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              No doubts found
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategory
                ? "Try adjusting your search criteria"
                : "No resolved doubts available yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-6">
              {currentDoubts.map((doubt) => (
                <div
                  key={doubt.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-green-500"
                >
                  <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate pr-2">
                          {doubt.title}
                        </h2>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            doubt.category
                          )}`}
                        >
                          {doubt.category}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedDoubt(
                            expandedDoubt === doubt.id ? null : doubt.id
                          )
                        }
                        className="ml-0 sm:ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-sm self-start"
                      >
                        {expandedDoubt === doubt.id ? "Collapse" : "Expand"}
                      </button>
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <strong>Coder:</strong> {doubt.userDetails.name}
                      </div>
                      <div>
                        <strong>Roll:</strong> {doubt.userDetails.roll}
                      </div>
                      <div>
                        <strong>Asked:</strong> {formatDate(doubt.timestamp)}
                      </div>
                      <div>
                        <strong>Solved by:</strong>{" "}
                        {doubt.solution?.solvedBy?.name}
                      </div>
                    </div>

                    {/* Problem Description (Always visible) */}
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                        Problem:
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3 text-sm sm:text-base">
                          {doubt.description}
                        </p>
                        {doubt.attachment && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            📎 Attachment: {doubt.attachment.name}
                            {doubt.attachment.type === "image" && " (Image)"}
                            {doubt.attachment.type === "code" && " (Code file)"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Solution Preview */}
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                        Solution:
                      </h3>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3 text-sm sm:text-base">
                          {doubt.solution?.content}
                        </p>
                        {doubt.solution?.attachments &&
                          doubt.solution.attachments.length > 0 && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                              📎 {doubt.solution.attachments.length}{" "}
                              attachment(s) in solution
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedDoubt === doubt.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {/* Full Problem Description */}
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Problem Description:
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm sm:text-base">
                              {doubt.description}
                            </p>
                          </div>
                        </div>

                        {/* Attachment */}
                        {doubt.attachment && (
                          <div className="mb-6">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Coder's Attachment:
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                📎 {doubt.attachment.name}
                              </p>
                              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                {doubt.attachment.type === "image" ? (
                                  <img
                                    src={
                                      doubt.attachment.data ||
                                      `data:image/*;base64,${doubt.attachment.content}`
                                    }
                                    alt={doubt.attachment.name}
                                    className="max-w-full h-auto max-h-48 sm:max-h-64 rounded cursor-pointer hover:opacity-80"
                                    onClick={() =>
                                      window.open(
                                        doubt.attachment.data ||
                                          `data:image/*;base64,${doubt.attachment.content}`,
                                        "_blank"
                                      )
                                    }
                                  />
                                ) : (
                                  <div className="code-container dark:bg-gray-900 bg-gray-200 rounded-lg overflow-hidden relative group">
                                    <pre
                                      className={`p-4 overflow-x-auto transition-transform duration-500 ${
                                        isCodeLong(doubt.attachment.content) &&
                                        !expandedSnippets[
                                          `doubt-attachment-${doubt.id}`
                                        ]
                                          ? "max-h-70"
                                          : ""
                                      }`}
                                    >
                                      <code className={`language-javascript`}>
                                        {isCodeLong(doubt.attachment.content) &&
                                        !expandedSnippets[
                                          `doubt-attachment-${doubt.id}`
                                        ]
                                          ? doubt.attachment.content
                                              .split("\n")
                                              .slice(0, maxCodeLines)
                                              .join("\n") + "\n..."
                                          : doubt.attachment.content}
                                      </code>
                                    </pre>

                                    {/* Code expand button */}
                                    {isCodeLong(doubt.attachment.content) && (
                                      <div className="flex justify-center p-2">
                                        <button
                                          className="px-6 py-2 text-sm font-medium rounded-full mx-auto dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 bg-gray-300 hover:bg-gray-400 text-gray-600 transition-colors duration-300"
                                          onClick={() => {
                                            // Remove highlighting before animation
                                            const codeBlocks =
                                              document.querySelectorAll(
                                                "pre code"
                                              );
                                            codeBlocks.forEach((block) => {
                                              block.removeAttribute(
                                                "data-highlighted"
                                              );
                                              block.className = block.className
                                                .replace(/hljs[^\s]*/g, "")
                                                .trim();
                                            });
                                            toggleExpand(
                                              `doubt-attachment-${doubt.id}`
                                            );
                                          }}
                                        >
                                          {expandedSnippets[
                                            `doubt-attachment-${doubt.id}`
                                          ]
                                            ? "Collapse "
                                            : "Expand "}
                                          Code
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Full Solution */}
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Complete Solution:
                          </h3>
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm sm:text-base">
                              {doubt.solution?.content}
                            </p>
                          </div>

                          {/* Solution Attachments */}
                          {doubt.solution?.attachments &&
                            doubt.solution.attachments.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Solution Attachments:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {doubt.solution.attachments.map(
                                    (attachment, index) => (
                                      <div
                                        key={index}
                                        className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600"
                                      >
                                        {attachment.type === "image" ? (
                                          <div>
                                            <div className="flex items-center mb-2">
                                              <i className="fas fa-image text-green-500 mr-2"></i>
                                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                {attachment.name}
                                              </span>
                                            </div>
                                            <img
                                              src={
                                                attachment.data ||
                                                attachment.content
                                              }
                                              alt={attachment.name}
                                              className="w-full max-w-sm h-auto rounded border shadow-sm cursor-pointer hover:opacity-80"
                                              onClick={() =>
                                                window.open(
                                                  attachment.data ||
                                                    attachment.content,
                                                  "_blank"
                                                )
                                              }
                                            />
                                          </div>
                                        ) : (
                                          <div>
                                            <div className="flex items-center mb-2">
                                              <i className="fas fa-file-code text-blue-500 mr-2 flex-shrink-0"></i>
                                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                                                {attachment.name}
                                              </span>
                                              {attachment.size && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                                  (
                                                  {Math.round(
                                                    attachment.size / 1024
                                                  )}
                                                  KB)
                                                </span>
                                              )}
                                            </div>
                                            <div className="code-container dark:bg-gray-900 bg-gray-200 rounded-lg overflow-hidden relative group">
                                              <pre
                                                className={`p-4 overflow-x-auto transition-transform duration-500 ${
                                                  isCodeLong(
                                                    attachment.content
                                                  ) &&
                                                  !expandedSnippets[
                                                    `solution-${doubt.id}-${index}`
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
                                                    `solution-${doubt.id}-${index}`
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
                                                    className="px-6 py-2 text-sm font-medium rounded-full mx-auto dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 bg-gray-300 hover:bg-gray-400 text-gray-600 transition-colors duration-300"
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
                                                        `solution-${doubt.id}-${index}`
                                                      );
                                                    }}
                                                  >
                                                    {expandedSnippets[
                                                      `solution-${doubt.id}-${index}`
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

                        {/* Solution Details */}
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>
                            Solved by{" "}
                            <strong>{doubt.solution?.solvedBy?.name}</strong> (
                            {doubt.solution?.solvedBy?.roll}) on{" "}
                            {formatDate(doubt.solution?.solvedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded text-sm ${
                      currentPage === 1
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded text-sm ${
                          currentPage === page
                            ? "bg-blue-600 text-white dark:bg-blue-500"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded text-sm ${
                      currentPage === totalPages
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoubtsArchive;
