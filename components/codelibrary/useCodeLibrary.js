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
  const [loadCount, setLoadCount] = useState(5); // Number of snippets to load initially
  const [TotalSnippets, setTotalSnippets] = useState([]);
  const [loadedSnippets, setLoadedSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [animateLike, setAnimateLike] = useState({});
  const [animateCopy, setAnimateCopy] = useState({});
  const [copiedStates, setCopiedStates] = useState({});
  const [hasMore, setHasMore] = useState(true);

  const needsHighlightRef = useRef(false);

  //get all snippets from database
  useEffect(() => {
    const codesRef = ref(codelibraryDb, "codes/");

    const unsubscribe = onValue(
      codesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Flatten and transform all snippets
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
                // Ensure timestamp for sorting
                timestamp: snippet.date ? new Date(snippet.date).getTime() : 0,
              });
            });
          });

          // Sort by timestamp (newest first)
          allSnippets.sort((a, b) => b.timestamp - a.timestamp);

          // Store ALL fetched snippets in TotalSnippets
          setTotalSnippets(allSnippets);

          // Store total count for reference
          const totalCount = allSnippets.length;

          // Limit to requested count for display optimization
          const limitedSnippets = allSnippets.slice(0, loadCount);
          setHasMore(totalCount > loadCount);
          setLoadedSnippets(limitedSnippets);

          console.log(
            `✅ Fetched ${totalCount} total snippets, displaying ${limitedSnippets.length}`
          );
        } else {
          setTotalSnippets([]);
          setLoadedSnippets([]);
          setHasMore(false);
          console.log("No snippets found in codes/");
        }
      },
      (error) => {
        console.error("Firebase error:", error);
        setTotalSnippets([]);
        setLoadedSnippets([]);
        setHasMore(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function loadMore() {
    if (!hasMore) return;
    const newLoadCount = loadCount + 10;
    setLoadCount(newLoadCount);

    // Load more snippets from TotalSnippets
    const limitedSnippets = TotalSnippets.slice(0, newLoadCount);
    setLoadedSnippets(limitedSnippets);
    setHasMore(TotalSnippets.length > newLoadCount);
  }

  // Filter snippets
  useEffect(() => {
    let result = [];
    if (searchTerm) {
      result = TotalSnippets.filter(
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
      result = TotalSnippets.filter(
        (snippet) =>
          snippet.language?.toLowerCase() === languageFilter.toLowerCase()
      );
    }
    if (authorFilter) {
      result = TotalSnippets.filter(
        (snippet) =>
          snippet.author?.toLowerCase() === authorFilter.toLowerCase()
      );
    }
    setFilteredSnippets(result);
  }, [searchTerm, languageFilter, authorFilter, loadedSnippets]);

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
  }, [filteredSnippets, expandedSnippets]);

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

      setLoadedSnippets((prevSnippets) =>
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
          copiesCount:
            (loadedSnippets.find((s) => s.id === id).copiesCount || 0) + 1,
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

    const snippet = loadedSnippets.find((s) => s.id === id);
    if (snippet.isLiked) return;

    const newIsLiked = true;
    setAnimateLike((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAnimateLike((prev) => ({ ...prev, [id]: false })), 500);

    setLoadedSnippets((prevSnippets) =>
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
      setLoadedSnippets((prevSnippets) =>
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

  return {
    // State
    TotalSnippets,
    loadedSnippets,
    filteredSnippets,
    searchTerm,
    languageFilter,
    authorFilter,
    expandedSnippets,
    animateLike,
    animateCopy,
    copiedStates,
    hasMore,
    loadCount,

    // Setters
    setSearchTerm,
    setLanguageFilter,
    setAuthorFilter,

    // Functions
    copyCode,
    toggleLike,
    toggleExpand,
    loadMore, // Helper to load 10 more
  };
};
