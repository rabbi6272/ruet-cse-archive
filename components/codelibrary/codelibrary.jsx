"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, off, update } from "firebase/database";
import { users } from "@/lib/mino";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";
import CommentSection from "./CommentSection";
import AuthUtils from "@/lib/auth-utils-secure";

import { lato } from "@/app/ui/fonts";

function getNameFromRoll(roll) {
  // Find the user with the matching roll number
  const user = users.find((u) => u.roll === roll);

  if (!user) {
    return "User not found"; // Handle case where roll doesn't exist
  }

  // Format the name (convert to Title Case)
  const formattedName = user.name
    .toLowerCase() // Convert to lowercase first
    .split(" ") // Split into parts (e.g., ["bitto", "saha"])
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
    .join(" "); // Join back into a string (e.g., "Bitto Saha")

  return formattedName;
}

const CodeLibrary = () => {
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [animateLike, setAnimateLike] = useState({});
  const [animateCopy, setAnimateCopy] = useState({});
  const [copiedStates, setCopiedStates] = useState({});
  const snippetsPerPage = 5;
  const maxCodeLines = 20;

  const needsHighlightRef = useRef(false);

  // Date formatting function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Unknown Date";
    }
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Fetch snippets from Firebase
  useEffect(() => {
    const snippetsRef = ref(db, "codeSnippets");
    const fetchData = onValue(
      snippetsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const snippetsArray = Object.keys(data)
              .map((key) => ({
                id: key,
                ...data[key],
                isLiked: localStorage.getItem(`liked_${key}`) === "true",
                likesCount: data[key].likesCount || 0,
                copiesCount: data[key].copiesCount || 0,
                language:
                  data[key].language?.toLowerCase() === "js"
                    ? "javascript"
                    : data[key].language?.toLowerCase(),
              }))
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            setSnippets(snippetsArray);
          } else {
            setSnippets([]);
          }
        } catch (error) {
          console.error("Error fetching snippets:", error);
          setSnippets([]);
        }
      },
      (error) => {
        console.error("Firebase error:", error);
        setSnippets([]);
      }
    );
    return () => off(snippetsRef, "value", fetchData);
  }, []);

  // Filter snippets
  useEffect(() => {
    let result = snippets;
    if (searchTerm) {
      result = result.filter(
        (snippet) =>
          snippet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          "" ||
          snippet.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ""
      );
    }
    if (languageFilter) {
      result = result.filter(
        (snippet) =>
          snippet.language?.toLowerCase() === languageFilter.toLowerCase()
      );
    }
    if (authorFilter) {
      result = result.filter(
        (snippet) =>
          snippet.author?.toLowerCase() === authorFilter.toLowerCase()
      );
    }
    setFilteredSnippets(result);
    if (currentPage > Math.ceil(result.length / snippetsPerPage)) {
      setCurrentPage(1);
    }
  }, [searchTerm, languageFilter, authorFilter, snippets, currentPage]);

  // Highlight code blocks
  useEffect(() => {
    needsHighlightRef.current = true; // Flag to indicate highlighting is needed
    const highlight = () => {
      if (needsHighlightRef.current) {
        document.querySelectorAll("pre code").forEach((block) => {
          if (block.hasAttribute("data-highlighted")) {
            block.removeAttribute("data-highlighted");
          }
          hljs.highlightElement(block);
        });
        needsHighlightRef.current = false;
      }
    };

    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(highlight);
      });
    }, 100); // Slight delay for DOM stability

    return () => clearTimeout(timeout);
  }, [filteredSnippets, expandedSnippets, currentPage]); // Added currentPage to dependencies

  const indexOfLastSnippet = currentPage * snippetsPerPage;
  const indexOfFirstSnippet = indexOfLastSnippet - snippetsPerPage;
  const currentSnippets = filteredSnippets.slice(
    indexOfFirstSnippet,
    indexOfLastSnippet
  );
  const totalPages = Math.ceil(filteredSnippets.length / snippetsPerPage);

  const copyCode = async (id, code) => {
    try {
      await navigator.clipboard.writeText(code);
      setAnimateCopy((prev) => ({ ...prev, [id]: true }));
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      
      setTimeout(() => {
        setAnimateCopy((prev) => ({ ...prev, [id]: false }));
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000); // Show "Copied" for 2 seconds
      
      setSnippets((prevSnippets) =>
        prevSnippets.map((snippet) =>
          snippet.id === id
            ? { ...snippet, copiesCount: (snippet.copiesCount || 0) + 1 }
            : snippet
        )
      );
      const snippetRef = ref(db, `codeSnippets/${id}`);
      await update(snippetRef, {
        copiesCount: (snippets.find((s) => s.id === id).copiesCount || 0) + 1,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleLike = async (id) => {
    const snippet = snippets.find((s) => s.id === id);
    if (snippet.isLiked) return;

    const newIsLiked = true;
    setAnimateLike((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAnimateLike((prev) => ({ ...prev, [id]: false })), 500);

    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) =>
        snippet.id === id
          ? {
              ...snippet,
              likesCount: (snippet.likesCount || 0) + 1,
              isLiked: newIsLiked,
            }
          : snippet
      )
    );

    localStorage.setItem(`liked_${id}`, "true");

    const snippetRef = ref(db, `codeSnippets/${id}`);
    await update(snippetRef, {
      likesCount: (snippet.likesCount || 0) + 1,
    });
  };

  const toggleExpand = (id) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const isCodeLong = (code) => {
    return code?.split("\n").length > maxCodeLines;
  };

  // Generate pagination numbers with ellipsis
  const generatePaginationNumbers = () => {
    const delta = window.innerWidth < 768 ? 1 : 2; // Fewer pages on mobile
    const range = [];
    const rangeWithDots = [];

    // Always include first page
    range.push(1);

    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always include last page if there are more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add ellipsis where needed
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  return (
    <div
      className={`${
        lato.className
      } min-h-screen transition-colors duration-300 ${darkMode ? "dark" : ""}`}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          {/* Title and description */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl dark:text-gray-300 text-gray-700 font-bold mb-2">
                Code Snippets Gallery
              </h1>
              <p className="mb-6 dark:text-gray-400 text-gray-600">
                Browse and share useful code snippets. We do not showcase any
                kind of AI-generated content here. Feel free to use any code you
                like, but please give credit to the original author. Happy
                coding!
              </p>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-white border-gray-300 text-gray-700"
              />
              <button className="absolute right-3 top-2 dark:text-gray-400 dark:hover:text-gray-300 text-gray-400 hover:text-gray-500">
                <i className="fas fa-search"></i>
              </button>
            </div>
            <div className="flex gap-4">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 bg-white border-gray-300 text-gray-500"
              >
                <option value="">All Languages</option>
                {Array.from(
                  new Set(snippets.map((s) => s.language).filter(Boolean))
                ).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              {/* Author filter - uncomment to re-enable */}
              {/* <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 bg-white border-gray-300 text-gray-500"
              >
                <option value="">All Authors</option>
                {Array.from(new Set(snippets.map((s) => s.author).filter(Boolean))).map((author) => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select> */}
            </div>
          </div>
        </div>

        {/* Snippet Cards */}
        <div className="space-y-6">
          {currentSnippets.length > 0 ? (
            currentSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 border dark:border-gray-700 bg-white border-gray-300"
              >
                {/* Individual Snippet Card */}
                <div className="p-4 lg:p-5">
                  <div className="flex justify-between items-start">
                    <span className="inline-block text-xs px-2 py-1 rounded-full font-semibold uppercase dark:bg-blue-900 dark:text-blue-300 bg-blue-100 text-blue-800">
                      {snippet.language}
                    </span>
                    <span className="text-xs dark:text-gray-400 text-gray-500">
                      {formatDate(snippet.date)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold dark:text-gray-100 text-gray-800">
                    {snippet.title}
                  </h3>
                  <p className="mt-1 text-wrap dark:text-gray-400 text-gray-600">
                    {snippet.description}
                  </p>

                  <div className="code-container dark:bg-gray-900 bg-gray-200 mt-4 rounded-lg overflow-hidden relative group">
                    {/* Copy button */}
                    <button
                      className={`copy-btn px-2 py-1 rounded text-xs absolute top-2 right-2 opacity-100 xl:opacity-0 transition-all duration-300 group-hover:opacity-100 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-white bg-gray-900 hover:bg-gray-800 text-white ${
                        copiedStates[snippet.id] ? 'bg-green-600 dark:bg-green-600' : ''
                      }`}
                      onClick={() => copyCode(snippet.id, snippet.codeSnippet)}
                    >
                      <i className={`${copiedStates[snippet.id] ? 'fas fa-check' : 'far fa-copy'} mr-1`}></i> 
                      {copiedStates[snippet.id] ? 'Copied' : 'Copy'}
                    </button>

                    {/* Code snippet */}
                    <pre
                      className={`p-4 overflow-x-auto transition-transform duration-500 ${
                        isCodeLong(snippet.codeSnippet) &&
                        !expandedSnippets[snippet.id]
                          ? "max-h-70"
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
                      <div className="flex justify-center p-2">
                        <button
                          className="px-6 py-2 text-sm font-medium rounded-full mx-auto dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 bg-gray-300 hover:bg-gray-400 text-gray-600 transition-colors duration-300"
                          onClick={() => toggleExpand(snippet.id)}
                        >
                          {expandedSnippets[snippet.id]
                            ? "Collapse "
                            : "Expand "}
                          Code
                        </button>
                      </div>
                    )}
                  </div>

                  {/* About the author and code description */}
                  <div className="mt-4 flex justify-between items-center text-sm">
                    {/* Author Name */}
                    <span className="font-medium dark:text-gray-400 text-gray-500">
                      {getNameFromRoll(snippet.rollNumber) +
                        ` (${snippet.rollNumber})`}
                    </span>
                    {/* Likes and Copies */}
                    <div className="flex items-center space-x-2">
                      <button
                        className={`mr-2 ${
                          snippet.isLiked
                            ? "text-red-500"
                            : "dark:text-gray-400 text-gray-500"
                        } hover:text-red-500 ${
                          animateLike[snippet.id] ? "animate-bounce" : ""
                        }`}
                        onClick={() => toggleLike(snippet.id)}
                      >
                        <i
                          className={`${
                            snippet.isLiked ? "fas" : "far"
                          } fa-heart`}
                        ></i>
                      </button>
                      <span
                        className={`dark:text-gray-400 text-gray-600 ${
                          animateLike[snippet.id] ? "animate-bounce" : ""
                        }`}
                      >
                        {snippet.likesCount || 0} Likes
                      </span>
                      {/* <span
                        className={`dark:text-gray-400 text-gray-600 ${
                          animateCopy[snippet.id] ? " animate-bounce" : ""
                        }`}
                      >
                        {snippet.copiesCount || 0} Copies
                      </span> */}
                    </div>
                  </div>

                  {/* Comment Section */}
                  <CommentSection
                    snippetId={snippet.id}
                    snippetAuthor={snippet.rollNumber}
                    snippetTitle={snippet.title}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 dark:text-gray-400 text-gray-600">
              No snippets found matching your criteria
            </div>
          )}
        </div>

        {filteredSnippets.length > snippetsPerPage && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow-sm overflow-hidden">
              {/* Previous button */}
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-2 md:px-3 py-2 text-sm md:text-base rounded-l-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 bg-white border-gray-300 text-gray-500 hover:bg-gray-50 ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">
                  <i className="fas fa-chevron-left"></i>
                </span>
              </button>

              {/* Page numbers with ellipsis */}
              <div className="hidden xs:flex">
                {generatePaginationNumbers().map((item, index) => {
                  if (item === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 md:px-3 py-2 text-sm md:text-base border-t border-b dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 bg-white border-gray-300 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNumber = item;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`px-2 md:px-3 py-2 text-sm md:text-base border-t border-b dark:bg-gray-800 dark:border-gray-700 ${
                        currentPage === pageNumber
                          ? "dark:text-blue-400 dark:bg-gray-700"
                          : "dark:text-gray-300 dark:hover:bg-gray-700"
                      } bg-white border-gray-300 ${
                        currentPage === pageNumber
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Mobile page indicator */}
              <div className="xs:hidden flex items-center px-3 py-2 border-t border-b dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 bg-white border-gray-300 text-gray-500">
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
              </div>

              {/* Next button */}
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-2 md:px-3 py-2 text-sm md:text-base rounded-r-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 bg-white border-gray-300 text-gray-500 hover:bg-gray-50 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">
                  <i className="fas fa-chevron-right"></i>
                </span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeLibrary;
