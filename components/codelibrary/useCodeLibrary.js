"use client";
import { useState, useEffect, useRef } from "react";
import { ref, onValue, update } from "firebase/database";
import hljs from "highlight.js";
import AuthUtils from "@/lib/auth-utils-secure";
import ProtectedFirebaseDB from "@/lib/protected-firebase-db"; // Only used for authenticated operations (likes)

export const useCodeLibrary = (initialSnippets = []) => {
  // State management for public code library
  // Reading: Public access for all users
  // Copying: Public access (no auth required)
  // Liking: Requires authentication
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [animateLike, setAnimateLike] = useState({});
  const [animateCopy, setAnimateCopy] = useState({});
  const [copiedStates, setCopiedStates] = useState({});

  const snippetsPerPage = 5;
  const needsHighlightRef = useRef(false);

  // Fetch snippets from Firebase
  useEffect(() => {
    let unsubscribe = null;

    const fetchData = async () => {
      try {
        console.log("📚 Loading code snippets from Firebase...");

        // Check if we're on client side
        if (typeof window === "undefined") {
          console.log("Server-side rendering, skipping Firebase");
          return;
        }

        // For public access, use regular Firebase database first
        let database;
        try {
          console.log("🌐 Using public database access for code library");
          const { db } = await import("@/lib/firebase");
          database = db;

          if (!database) {
            console.error("Firebase database not available");
            return;
          }
        } catch (error) {
          console.error("Failed to access public Firebase database:", error);
          return;
        }

        const snippetsRef = ref(database, "codeSnippets");

        unsubscribe = onValue(
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
                console.log(`✅ Loaded ${snippetsArray.length} code snippets`);
              } else {
                setSnippets([]);
                console.log("No snippets found in database");
              }
            } catch (error) {
              console.error("Error processing snippets:", error);
              setSnippets([]);
            }
          },
          (error) => {
            console.error("Firebase error:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);

            // If this is a permission error and we're not using protected access,
            // the issue might be with Firebase rules or configuration
            if (error.code === "PERMISSION_DENIED") {
              console.error(
                "🔒 Permission denied - check Firebase database rules"
              );
            }

            setSnippets([]);
          }
        );
      } catch (error) {
        console.error("Failed to initialize Firebase listener:", error);
        setSnippets([]);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
    needsHighlightRef.current = true;
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
    }, 100);

    return () => clearTimeout(timeout);
  }, [filteredSnippets, expandedSnippets, currentPage]);

  // Copy code function
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

      try {
        // Use public Firebase database for copy count updates (public operation)
        const { db } = await import("@/lib/firebase");
        const snippetRef = ref(db, `codeSnippets/${id}`);
        await update(snippetRef, {
          copiesCount: (snippets.find((s) => s.id === id).copiesCount || 0) + 1,
        });
        console.log("✅ Copy count updated successfully");
      } catch (error) {
        console.error("Failed to update copy count:", error);
        // Copy still works locally even if database update fails
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Toggle like function
  const toggleLike = async (id) => {
    // Check if user is authenticated
    if (!AuthUtils.isAuthenticated()) {
      console.log("🔒 Login required for liking snippets");
      // Optionally show a toast or redirect to login
      window.location.href = "/user/login";
      return;
    }

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

    try {
      // Use ProtectedFirebaseDB for authenticated write operations
      const database = await ProtectedFirebaseDB.getDatabase();
      const snippetRef = ref(database, `codeSnippets/${id}`);
      await update(snippetRef, {
        likesCount: (snippet.likesCount || 0) + 1,
      });
    } catch (error) {
      console.error("Failed to update like count:", error);
      // Revert the like if the update failed
      setSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s.id === id
            ? {
                ...s,
                likesCount: (s.likesCount || 1) - 1,
                isLiked: false,
              }
            : s
        )
      );
      localStorage.removeItem(`liked_${id}`);
    }
  };

  // Toggle expand function
  const toggleExpand = (id) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Pagination
  const indexOfLastSnippet = currentPage * snippetsPerPage;
  const indexOfFirstSnippet = indexOfLastSnippet - snippetsPerPage;
  const currentSnippets = filteredSnippets.slice(
    indexOfFirstSnippet,
    indexOfLastSnippet
  );
  const totalPages = Math.ceil(filteredSnippets.length / snippetsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return {
    // State
    snippets,
    filteredSnippets,
    currentSnippets,
    searchTerm,
    languageFilter,
    authorFilter,
    currentPage,
    totalPages,
    expandedSnippets,
    animateLike,
    animateCopy,
    copiedStates,
    snippetsPerPage,

    // Setters
    setSearchTerm,
    setLanguageFilter,
    setAuthorFilter,

    // Functions
    copyCode,
    toggleLike,
    toggleExpand,
    paginate,
  };
};
