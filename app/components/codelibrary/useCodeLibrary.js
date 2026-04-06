"use client";
import { useState, useEffect, useRef } from "react";

import hljs from "highlight.js";

import AuthUtils from "@/lib/auth-utils-secure";

import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";

// State management for public code library
// Reading: Public access for all users
// Copying: Public access (no auth required)
// Liking: Requires authentication
export const useCodeLibrary = (initialSnippets = []) => {
  const DOCS_PER_PAGE = 3;
  const [loadCount, setLoadCount] = useState(initialSnippets.length || 0);
  const [TotalSnippets, setTotalSnippets] = useState(initialSnippets);
  const [loadedSnippets, setLoadedSnippets] = useState(initialSnippets);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [expandedSnippets, setExpandedSnippets] = useState({});
  const [animateLike, setAnimateLike] = useState({});
  const [animateCopy, setAnimateCopy] = useState({});
  const [copiedStates, setCopiedStates] = useState({});
  const [hasMore, setHasMore] = useState(false);

  const needsHighlightRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastVisibleDocRef = useRef(null);

  const flattenSnippetDocuments = (snapshots) => {
    const snippets = [];

    snapshots.docs.forEach((snippetDoc) => {
      const data = snippetDoc.data();

      if (Array.isArray(data.snippets)) {
        data.snippets.forEach((snippet) => {
          if (!snippet) return;
          snippets.push({
            ...snippet,
            id: snippet.id,
            rollNumber: snippet.rollNumber || snippetDoc.id,
            isLiked: localStorage.getItem(`liked_${snippet.id}`) === "true",
            likesCount: snippet.likesCount || 0,
            copiesCount: snippet.copiesCount || 0,
            language:
              snippet.language?.toLowerCase() === "js"
                ? "javascript"
                : snippet.language?.toLowerCase(),
            timestamp: snippet.date ? new Date(snippet.date).getTime() : 0,
          });
        });
        return;
      }

      snippets.push({
        ...data,
        id: snippetDoc.id,
        rollNumber: data.rollNumber || snippetDoc.id,
        isLiked: localStorage.getItem(`liked_${snippetDoc.id}`) === "true",
        likesCount: data.likesCount || 0,
        copiesCount: data.copiesCount || 0,
        language:
          data.language?.toLowerCase() === "js"
            ? "javascript"
            : data.language?.toLowerCase(),
        timestamp: data.date ? new Date(data.date).getTime() : 0,
      });
    });

    return snippets.sort((left, right) => right.timestamp - left.timestamp);
  };

  const mergeUniqueById = (existingSnippets, incomingSnippets) => {
    const knownIds = new Set(existingSnippets.map((snippet) => snippet.id));
    const uniqueIncoming = incomingSnippets.filter(
      (snippet) => !knownIds.has(snippet.id),
    );
    return [...existingSnippets, ...uniqueIncoming].sort(
      (left, right) => right.timestamp - left.timestamp,
    );
  };

  const fetchSnippetsPage = async ({ reset = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (reset) {
        lastVisibleDocRef.current = null;
      }

      const snippetsRef = collection(CodelibraryDB, COLLECTION);
      let snippetsQuery = query(
        snippetsRef,
        orderBy(documentId()),
        limit(DOCS_PER_PAGE),
      );

      if (lastVisibleDocRef.current) {
        snippetsQuery = query(
          snippetsRef,
          orderBy(documentId()),
          startAfter(lastVisibleDocRef.current),
          limit(DOCS_PER_PAGE),
        );
      }

      const snapshots = await getDocs(snippetsQuery);
      const pageSnippets = flattenSnippetDocuments(snapshots);
      const lastDoc = snapshots.docs[snapshots.docs.length - 1] || null;

      lastVisibleDocRef.current = lastDoc;
      setHasMore(snapshots.docs.length === DOCS_PER_PAGE);

      if (!pageSnippets.length && reset) {
        setTotalSnippets([]);
        setLoadedSnippets([]);
        setLoadCount(0);
        return;
      }

      if (reset) {
        setTotalSnippets(pageSnippets);
        setLoadedSnippets(pageSnippets);
        setLoadCount(pageSnippets.length);
      } else {
        setTotalSnippets((prevSnippets) => {
          const nextSnippets = mergeUniqueById(prevSnippets, pageSnippets);
          setLoadCount(nextSnippets.length);
          return nextSnippets;
        });

        setLoadedSnippets((prevSnippets) =>
          mergeUniqueById(prevSnippets, pageSnippets),
        );
      }
    } catch (error) {
      console.error("Firestore fetch error:", error);
      if (reset) {
        setTotalSnippets([]);
        setLoadedSnippets([]);
        setLoadCount(0);
      }
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Get first page from Firestore
  useEffect(() => {
    fetchSnippetsPage({ reset: true });
  }, []);

  function loadMore() {
    if (!hasMore || isFetchingRef.current) return Promise.resolve();
    return fetchSnippetsPage();
  }

  // Filter snippets
  useEffect(() => {
    let result = [...loadedSnippets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (snippet) =>
          snippet.title?.toLowerCase().includes(term) ||
          snippet.description?.toLowerCase().includes(term),
      );
    }

    if (languageFilter) {
      result = result.filter(
        (snippet) =>
          snippet.language?.toLowerCase() === languageFilter.toLowerCase(),
      );
    }

    if (authorFilter) {
      result = result.filter(
        (snippet) =>
          snippet.author?.toLowerCase() === authorFilter.toLowerCase(),
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
            : snippet,
        ),
      );

      setTotalSnippets((prevSnippets) =>
        prevSnippets.map((snippet) =>
          snippet.id === id
            ? { ...snippet, copiesCount: (snippet.copiesCount || 0) + 1 }
            : snippet,
        ),
      );

      try {
        const snippet = loadedSnippets.find((item) => item.id === id);
        if (!snippet) throw new Error("Snippet not found");

        const snippetRef = doc(CodelibraryDB, COLLECTION, snippet.rollNumber);
        const snapshots = await getDocs(collection(CodelibraryDB, COLLECTION));
        const rollDoc = snapshots.docs.find(
          (item) => item.id === snippet.rollNumber,
        );

        if (!rollDoc) throw new Error("Roll document not found");

        const rollData = rollDoc.data();
        const nextSnippets = (
          Array.isArray(rollData.snippets) ? rollData.snippets : []
        ).map((item) =>
          item.id === id
            ? { ...item, copiesCount: (item.copiesCount || 0) + 1 }
            : item,
        );

        await updateDoc(snippetRef, {
          snippets: nextSnippets,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to update copy count:", error);
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
      window.location.href = "/user/login";
      return;
    }

    const snippet = loadedSnippets.find((s) => s.id === id);
    if (!snippet || snippet.isLiked) return;

    const newIsLiked = true;
    setAnimateLike((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAnimateLike((prev) => ({ ...prev, [id]: false })), 500);

    setLoadedSnippets((prevSnippets) =>
      prevSnippets.map((s) =>
        s.id === id
          ? {
              ...s,
              likesCount: (s.likesCount || 0) + 1,
              isLiked: newIsLiked,
            }
          : s,
      ),
    );

    setTotalSnippets((prevSnippets) =>
      prevSnippets.map((s) =>
        s.id === id
          ? {
              ...s,
              likesCount: (s.likesCount || 0) + 1,
              isLiked: newIsLiked,
            }
          : s,
      ),
    );

    localStorage.setItem(`liked_${id}`, "true");

    try {
      const snippet = loadedSnippets.find((item) => item.id === id);
      if (!snippet) throw new Error("Snippet not found");

      const rollDocRef = doc(CodelibraryDB, COLLECTION, snippet.rollNumber);
      const snapshots = await getDocs(collection(CodelibraryDB, COLLECTION));
      const rollDoc = snapshots.docs.find(
        (item) => item.id === snippet.rollNumber,
      );

      if (!rollDoc) throw new Error("Roll document not found");

      const rollData = rollDoc.data();
      const nextSnippets = (
        Array.isArray(rollData.snippets) ? rollData.snippets : []
      ).map((item) =>
        item.id === id
          ? { ...item, likesCount: (item.likesCount || 0) + 1, isLiked: true }
          : item,
      );

      await updateDoc(rollDocRef, {
        snippets: nextSnippets,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update like count:", error);
      setLoadedSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s.id === id
            ? {
                ...s,
                likesCount: (s.likesCount || 1) - 1,
                isLiked: false,
              }
            : s,
        ),
      );
      setTotalSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s.id === id
            ? {
                ...s,
                likesCount: (s.likesCount || 1) - 1,
                isLiked: false,
              }
            : s,
        ),
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
    loadMore, // Helper to load 5 more
  };
};
