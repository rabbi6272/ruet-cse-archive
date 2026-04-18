"use client";
// @ts-check
/** @typedef {import('./types').Snippet} Snippet */

import "highlight.js/styles/monokai.css";
import { lato } from "@/app/fonts";
import { useEffect, useRef, useState } from "react";

import { useCodeLibrary } from "./useCodeLibrary";
import SearchAndFilters from "./SearchAndFilters";
import SnippetCard from "./SnippetCard";
import StatisticsSidebar from "./StatisticsSidebar";
import Loading from "@/app/loading";

const CLIENT_CHUNK_SIZE = 12;

/**
 * @param {{ initialSnippets?: Snippet[] }} props
 */
export function CodeLibraryBody({ initialSnippets = [] }) {
  const {
    snippets,
    activeSnippets,
    hasMore,
    searchTerm,
    languageFilter,
    authorFilter,
    expandedSnippets,
    animateLike,
    copiedStates,
    loadMore,
    setSearchTerm,
    setLanguageFilter,
    setAuthorFilter,
    copyCode,
    toggleLike,
    toggleExpand,
  } = useCodeLibrary(initialSnippets);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CLIENT_CHUNK_SIZE);
  const loadMoreRef = useRef(/** @type {HTMLDivElement|null} */ (null));

  const visibleSnippets = activeSnippets.slice(0, visibleCount);
  const hasVisibleMore = activeSnippets.length > visibleCount;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(CLIENT_CHUNK_SIZE);
  }, [searchTerm, languageFilter, authorFilter]);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || (!hasVisibleMore && !hasMore)) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || isLoadingMore) return;
        if (hasVisibleMore) { setVisibleCount((prev) => prev + CLIENT_CHUNK_SIZE); return; }
        if (!hasMore) return;

        setIsLoadingMore(true);
        try { await loadMore(); }
        finally { setIsLoadingMore(false); }
      },
      { root: null, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, hasVisibleMore, isLoadingMore, loadMore]);

  return (
    <div className={`${lato.className} min-h-screen transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <SearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            languageFilter={languageFilter}
            setLanguageFilter={setLanguageFilter}
            snippets={snippets}
          />
          <div className="space-y-6">
            {activeSnippets.length > 0 ? (
              visibleSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  isExpanded={expandedSnippets[snippet.id] ?? false}
                  onToggleExpand={toggleExpand}
                  onToggleLike={toggleLike}
                  onCopyCode={copyCode}
                  copiedStates={copiedStates}
                  animateLike={animateLike}
                />
              ))
            ) : (
              <Loading />
            )}
          </div>
          {(hasVisibleMore || hasMore) && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <div className="animate-pulse text-gray-500">
                {isLoadingMore ? "Loading more snippets…" : "Scroll for more snippets…"}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="text-xl lg:text-2xl mr-2">📊</span>Community Stats
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top contributors and activity trends</p>
            </div>
            <StatisticsSidebar />
          </div>
        </div>

      </div>
    </div>
  );
}
