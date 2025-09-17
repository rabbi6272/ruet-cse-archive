"use client";
import { useState, useEffect, useRef } from "react";
import { ref, onValue, update } from "firebase/database";
import hljs from "highlight.js";
import AuthUtils from "@/lib/auth-utils-secure";
import { codelibraryDb } from "@/lib/codelibraryDB";

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

  // Fetch snippets from new codes/ structure
  useEffect(() => {
    const codesRef = ref(codelibraryDb, "codes/");
    const unsubscribe = onValue(
      codesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Flatten: [{...snippet, rollNumber, id}, ...]
          const allSnippets = [];
          Object.entries(data).forEach(([rollNumber, codes]) => {
            Object.entries(codes).forEach(([codeId, snippet]) => {
              allSnippets.push({
                ...snippet,
                rollNumber,
                id: codeId,
                isLiked: localStorage.getItem(`liked_${codeId}`) === "true",
                likesCount: snippet.likesCount || 0,
                copiesCount: snippet.copiesCount || 0,
                language:
                  snippet.language?.toLowerCase() === "js"
                    ? "javascript"
                    : snippet.language?.toLowerCase(),
              });
            });
          });
          // Sort by date (newest first)
          allSnippets.sort((a, b) => new Date(b.date) - new Date(a.date));
          setSnippets(allSnippets);
          console.log(
            `✅ Loaded ${allSnippets.length} code snippets from codes/`
          );
        } else {
          setSnippets([]);
          console.log("No snippets found in codes/");
        }
      },
      (error) => {
        console.error("Firebase error:", error);
        setSnippets([]);
      }
    );
    return () => unsubscribe();
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
