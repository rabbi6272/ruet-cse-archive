"use client";

import { useState, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
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
import type {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import {
  CodelibraryDB,
  COLLECTION,
  ensureCodelibraryAuth,
} from "@/utils/CodelibraryDB";
import {
  decorateSnippet,
  matchesSnippetId,
  normalizeSnippets,
} from "@/lib/codelibrary/snippetIdentity";
import type {
  DecodedSnippet,
  SnippetLike,
} from "@/lib/codelibrary/snippetIdentity";
import type { Comment, Snippet } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCS_PER_PAGE = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeLanguage(lang?: string): string {
  if (!lang) return "";
  const lower = lang.toLowerCase();
  return lower === "js" ? "javascript" : lower;
}

/**
 * Flatten Firestore snapshot docs into a flat Snippet[].
 * Each roll document holds a `snippets` array. Comments are embedded inside
 * each snippet object and preserved as-is.
 */
function flattenDocs(snap: QuerySnapshot<DocumentData>): Snippet[] {
  const result: Snippet[] = [];

  snap.docs.forEach((snapDoc) => {
    const data = snapDoc.data();
    const snippetsArr: DecodedSnippet[] = Array.isArray(data.snippets)
      ? normalizeSnippets(data.snippets, snapDoc.id)
      : [decorateSnippet(data, snapDoc.id)];

    snippetsArr.forEach((raw) => {
      if (!raw) return;
      result.push({
        ...raw,
        isLiked: localStorage.getItem(`liked_${raw.id}`) === "true",
        likesCount: raw.likesCount ?? 0,
        copiesCount: raw.copiesCount ?? 0,
        language: normalizeLanguage(raw.language),
        timestamp: raw.date ? new Date(raw.date).getTime() : 0,
        comments: (raw.comments as Comment[] | undefined) ?? [],
      });
    });
  });

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Merge two Snippet arrays by id, keeping newest-first order.
 */
function mergeById(existing: Snippet[], incoming: Snippet[]): Snippet[] {
  const seen = new Set(existing.map((s) => s.id));
  return [...existing, ...incoming.filter((s) => !seen.has(s.id))].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
}

/**
 * Read-modify-write a single snippet field inside its roll document.
 * Uses getDoc (1 read) not getDocs (full collection scan).
 */
async function patchSnippetInFirestore(
  rollNumber: string,
  snippetId: string,
  updater: (raw: SnippetLike) => SnippetLike,
): Promise<void> {
  await ensureCodelibraryAuth();

  const rollRef = doc(CodelibraryDB, COLLECTION, rollNumber);
  const rollSnap = await getDoc(rollRef);
  if (!rollSnap.exists()) return;

  const data = rollSnap.data();
  const nextSnippets = (Array.isArray(data.snippets) ? data.snippets : []).map(
    (item: SnippetLike) =>
      matchesSnippetId(item, snippetId, rollNumber) ? updater(item) : item,
  );

  await updateDoc(rollRef, {
    snippets: nextSnippets,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseCodeLibraryReturn = {
  snippets: Snippet[];
  activeSnippets: Snippet[];
  hasActiveFilters: boolean;
  searchTerm: string;
  languageFilter: string;
  authorFilter: string;
  expandedSnippets: Record<string, boolean>;
  animateLike: Record<string, boolean>;
  animateCopy: Record<string, boolean>;
  copiedStates: Record<string, boolean>;
  hasMore: boolean;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setLanguageFilter: Dispatch<SetStateAction<string>>;
  setAuthorFilter: Dispatch<SetStateAction<string>>;
  copyCode: (id: string, code: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleExpand: (id: string) => void;
  loadMore: () => Promise<void>;
};

export function useCodeLibrary(
  initialSnippets: Snippet[] = [],
): UseCodeLibraryReturn {
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});
  const [animateLike, setAnimateLike] = useState<Record<string, boolean>>({});
  const [animateCopy, setAnimateCopy] = useState<Record<string, boolean>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState(false);

  const isFetchingRef = useRef(false);
  const lastVisibleDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // ── Pagination ──────────────────────────────────────────────────────────────

  async function fetchPage(reset = false): Promise<void> {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      await ensureCodelibraryAuth();

      if (reset) lastVisibleDocRef.current = null;

      const constraints: QueryConstraint[] = [
        orderBy(documentId()),
        ...(lastVisibleDocRef.current ? [startAfter(lastVisibleDocRef.current)] : []),
        limit(DOCS_PER_PAGE),
      ];

      const snap = await getDocs(
        query(collection(CodelibraryDB, COLLECTION), ...constraints),
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

  useEffect(() => {
    fetchPage(true);
  }, []);

  function loadMore(): Promise<void> {
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

  // ── Patch helper ────────────────────────────────────────────────────────────

  function patchSnippet(id: string, patch: Partial<Snippet>): void {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  // ── Copy ────────────────────────────────────────────────────────────────────

  const copyCode = async (id: string, code: string): Promise<void> => {
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

      const newCount = (snippet.copiesCount ?? 0) + 1;
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

  const toggleLike = async (id: string): Promise<void> => {
    if (!AuthUtils.isAuthenticated()) {
      window.location.href = "/user/login";
      return;
    }

    const snippet = snippets.find((s) => s.id === id);
    if (!snippet || snippet.isLiked) return;

    setAnimateLike((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAnimateLike((prev) => ({ ...prev, [id]: false })), 500);

    const newCount = (snippet.likesCount ?? 0) + 1;
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

  const toggleExpand = (id: string): void => {
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