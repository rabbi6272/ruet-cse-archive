"use client";
// @ts-check
/** @typedef {import('./types').Snippet} Snippet */

import { useState, useEffect, useRef } from "react";
import hljs from "highlight.js";
import AuthUtils from "@/lib/auth-utils-secure";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { CodelibraryDB, COLLECTION } from "@/utils/CodelibraryDB";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCS_PER_PAGE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * @param {string} [lang]
 * @returns {string}
 */
function normalizeLanguage(lang) {
  if (!lang) return "";
  const lower = lang.toLowerCase();
  return lower === "js" ? "javascript" : lower;
}

/**
 * Flatten Firestore snapshot docs into a flat Snippet[].
 * Each roll document holds a `snippets` array. Comments are embedded inside
 * each snippet object and preserved as-is.
 *
 * @param {import('firebase/firestore').QuerySnapshot} snap
 * @returns {Snippet[]}
 */
function flattenDocs(snap) {
  /** @type {Snippet[]} */
  const result = [];

  snap.docs.forEach((snapDoc) => {
    const data = snapDoc.data();
    const snippetsArr = Array.isArray(data.snippets) ? data.snippets : [data];

    snippetsArr.forEach((raw) => {
      if (!raw) return;
      const id = raw.id ?? snapDoc.id;
      result.push({
        ...raw,
        id,
        rollNumber: raw.rollNumber ?? snapDoc.id,
        isLiked: localStorage.getItem(`liked_${id}`) === "true",
        likesCount: raw.likesCount ?? 0,
        copiesCount: raw.copiesCount ?? 0,
        language: normalizeLanguage(raw.language),
        timestamp: raw.date ? new Date(raw.date).getTime() : 0,
        comments: raw.comments ?? [],
      });
    });
  });

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Merge two Snippet arrays by id, keeping newest-first order.
 * @param {Snippet[]} existing
 * @param {Snippet[]} incoming
 * @returns {Snippet[]}
 */
function mergeById(existing, incoming) {
  const seen = new Set(existing.map((s) => s.id));
  return [...existing, ...incoming.filter((s) => !seen.has(s.id))].sort(
    (a, b) => b.timestamp - a.timestamp
  );
}

/**
 * Read-modify-write a single snippet field inside its roll document.
 * Uses getDoc (1 read) not getDocs (full collection scan).
 *
 * @param {string} rollNumber
 * @param {string} snippetId
 * @param {(raw: any) => any} updater
 * @returns {Promise<void>}
 */
async function patchSnippetInFirestore(rollNumber, snippetId, updater) {
  const rollRef = doc(CodelibraryDB, COLLECTION, rollNumber);
  const rollSnap = await getDoc(rollRef);
  if (!rollSnap.exists()) return;

  const data = rollSnap.data();
  const nextSnippets = (Array.isArray(data.snippets) ? data.snippets : []).map(
    (item) => (item.id === snippetId ? updater(item) : item)
  );

  await updateDoc(rollRef, {
    snippets: nextSnippets,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} UseCodeLibraryReturn
 * @property {Snippet[]}                                      snippets
 * @property {Snippet[]}                                      activeSnippets
 * @property {boolean}                                        hasActiveFilters
 * @property {string}                                         searchTerm
 * @property {string}                                         languageFilter
 * @property {string}                                         authorFilter
 * @property {Record<string, boolean>}                        expandedSnippets
 * @property {Record<string, boolean>}                        animateLike
 * @property {Record<string, boolean>}                        animateCopy
 * @property {Record<string, boolean>}                        copiedStates
 * @property {boolean}                                        hasMore
 * @property {(v: string) => void}                            setSearchTerm
 * @property {(v: string) => void}                            setLanguageFilter
 * @property {(v: string) => void}                            setAuthorFilter
 * @property {(id: string, code: string) => Promise<void>}   copyCode
 * @property {(id: string) => Promise<void>}                 toggleLike
 * @property {(id: string) => void}                          toggleExpand
 * @property {() => Promise<void>}                           loadMore
 */

/**
 * @param {Snippet[]} [initialSnippets=[]]
 * @returns {UseCodeLibraryReturn}
 */
export function useCodeLibrary(initialSnippets = []) {
  const [snippets, setSnippets] = useState(initialSnippets);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [expandedSnippets, setExpandedSnippets] = useState(/** @type {Record<string,boolean>} */ ({}));
  const [animateLike, setAnimateLike] = useState(/** @type {Record<string,boolean>} */ ({}));
  const [animateCopy, setAnimateCopy] = useState(/** @type {Record<string,boolean>} */ ({}));
  const [copiedStates, setCopiedStates] = useState(/** @type {Record<string,boolean>} */ ({}));
  const [hasMore, setHasMore] = useState(false);

  const isFetchingRef = useRef(false);
  const lastVisibleDocRef = useRef(/** @type {any} */ (null));
  const needsHighlightRef = useRef(false);

  // ── Pagination ──────────────────────────────────────────────────────────────

  /**
   * @param {boolean} [reset=false]
   * @returns {Promise<void>}
   */
  async function fetchPage(reset = false) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (reset) lastVisibleDocRef.current = null;

      const constraints = [
        orderBy(documentId()),
        ...(lastVisibleDocRef.current ? [startAfter(lastVisibleDocRef.current)] : []),
        limit(DOCS_PER_PAGE),
      ];

      const snap = await getDocs(
        query(collection(CodelibraryDB, COLLECTION), ...constraints)
      );

      const page = flattenDocs(snap);
      lastVisibleDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHasMore(snap.docs.length === DOCS_PER_PAGE);
      setSnippets((prev) => (reset ? page : mergeById(prev, page)));
    } catch (err) {
      console.error("Firestore fetch error:", err);
      if (reset) setSnippets([]);
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
    }
  }

  useEffect(() => { fetchPage(true); }, []);

  /** @returns {Promise<void>} */
  function loadMore() {
    if (!hasMore || isFetchingRef.current) return Promise.resolve();
    return fetchPage();
  }

  // ── Derived: filtered snippets ──────────────────────────────────────────────

  const filteredSnippets = snippets.filter((s) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !s.title?.toLowerCase().includes(term) &&
        !s.description?.toLowerCase().includes(term)
      )
        return false;
    }
    if (languageFilter && s.language !== languageFilter.toLowerCase()) return false;
    if (authorFilter && s.author?.toLowerCase() !== authorFilter.toLowerCase()) return false;
    return true;
  });

  const hasActiveFilters = Boolean(searchTerm || languageFilter || authorFilter);
  const activeSnippets = hasActiveFilters ? filteredSnippets : snippets;

  // ── Syntax highlighting ─────────────────────────────────────────────────────

  useEffect(() => {
    needsHighlightRef.current = true;
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!needsHighlightRef.current) return;
          document.querySelectorAll("pre code").forEach((block) => {
            block.removeAttribute("data-highlighted");
            hljs.highlightElement(/** @type {HTMLElement} */ (block));
          });
          needsHighlightRef.current = false;
        });
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeSnippets, expandedSnippets]);

  // ── Patch helper ────────────────────────────────────────────────────────────

  /**
   * @param {string}           id
   * @param {Partial<Snippet>} patch
   */
  function patchSnippet(id, patch) {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  // ── Copy ────────────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   * @param {string} code
   * @returns {Promise<void>}
   */
  const copyCode = async (id, code) => {
    try {
      await navigator.clipboard.writeText(code);

      setAnimateCopy((prev) => ({ ...prev, [id]: true }));
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setAnimateCopy((prev) => ({ ...prev, [id]: false }));
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);

      const snippet = snippets.find((s) => s.id === id);
      if (!snippet) return;

      const newCount = snippet.copiesCount + 1;
      patchSnippet(id, { copiesCount: newCount });
      await patchSnippetInFirestore(snippet.rollNumber, id, (item) => ({
        ...item,
        copiesCount: newCount,
      }));
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ── Like ────────────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  const toggleLike = async (id) => {
    if (!AuthUtils.isAuthenticated()) {
      window.location.href = "/user/login";
      return;
    }

    const snippet = snippets.find((s) => s.id === id);
    if (!snippet || snippet.isLiked) return;

    setAnimateLike((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAnimateLike((prev) => ({ ...prev, [id]: false })), 500);

    const newCount = snippet.likesCount + 1;
    patchSnippet(id, { likesCount: newCount, isLiked: true });
    localStorage.setItem(`liked_${id}`, "true");

    try {
      await patchSnippetInFirestore(snippet.rollNumber, id, (item) => ({
        ...item,
        likesCount: newCount,
        isLiked: true,
      }));
    } catch (err) {
      console.error("Like update failed:", err);
      patchSnippet(id, { likesCount: snippet.likesCount, isLiked: false });
      localStorage.removeItem(`liked_${id}`);
    }
  };

  // ── Expand / collapse ───────────────────────────────────────────────────────

  /** @param {string} id */
  const toggleExpand = (id) => {
    setExpandedSnippets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return {
    snippets,
    activeSnippets,
    hasActiveFilters,
    searchTerm,
    languageFilter,
    authorFilter,
    expandedSnippets,
    animateLike,
    animateCopy,
    copiedStates,
    hasMore,
    setSearchTerm,
    setLanguageFilter,
    setAuthorFilter,
    copyCode,
    toggleLike,
    toggleExpand,
    loadMore,
  };
}
