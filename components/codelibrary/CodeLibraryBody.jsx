"use client";
import "highlight.js/styles/monokai.css";
import { lato } from "@/app/ui/fonts";

// Import the components
import { useCodeLibrary } from "./useCodeLibrary";
import SearchAndFilters from "./SearchAndFilters";
import SnippetCard from "./SnippetCard";
import StatisticsSidebar from "./StatisticsSidebar";
import Loading from "@/app/loading";
import { useEffect, useRef, useState } from "react";

export function CodeLibraryBody({ initialSnippets = [] }) {
  // Use the custom hook with initial data
  const {
    TotalSnippets,
    loadedSnippets,
    hasMore,
    filteredSnippets,
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

  //infinite scroll
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  useEffect(() => {
    if (!loadMoreRef.current || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        let timeoutId;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          timeoutId = setTimeout(() => {
            setIsLoadingMore(true);
            loadMore();
            setTimeout(() => setIsLoadingMore(false), 1000);
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: "100px", // ← Start loading 100px before reaching bottom
        threshold: 0,
      }
    );

    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
      setIsLoadingMore(false);
    };
  }, [hasMore, loadMore]);

  return (
    <div
      className={`${lato.className} min-h-screen dark:bg-gray-900 dark:text-white transition-colors duration-300 `}
    >
      {/* Main Layout - Split on Large Screens */}
      <div className="container mx-auto px-2 py-4 max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 relative">
        {/* Left Side - Code Library Content (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-3 order-2 lg:order-1">
          <SearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            languageFilter={languageFilter}
            setLanguageFilter={setLanguageFilter}
            authorFilter={authorFilter}
            setAuthorFilter={setAuthorFilter}
            snippets={TotalSnippets}
          />

          {/* Snippet Cards */}
          <div className="space-y-3">
            {loadedSnippets.length > 0 || filteredSnippets.length > 0 ? (
              // If there are filtered snippets from search box, show them
              filteredSnippets.length > 0 ? (
                filteredSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    isExpanded={expandedSnippets[snippet.id]}
                    onToggleExpand={toggleExpand}
                    onToggleLike={toggleLike}
                    onCopyCode={copyCode}
                    copiedStates={copiedStates}
                    animateLike={animateLike}
                  />
                ))
              ) : (
                // Otherwise, show the loaded snippets
                loadedSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    isExpanded={expandedSnippets[snippet.id]}
                    onToggleExpand={toggleExpand}
                    onToggleLike={toggleLike}
                    onCopyCode={copyCode}
                    copiedStates={copiedStates}
                    animateLike={animateLike}
                  />
                ))
              )
            ) : (
              <div>
                <Loading />
              </div>
            )}
          </div>
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              <div className="animate-pulse text-gray-500">
                Loading more snippets...
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Statistics Sidebar (1/3 width on large screens)*/}
        <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
          {/* Regular panel without sticky positioning */}
          <div className="max-h-none overflow-y-visible">
            <div className="mb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 flex items-center">
                Community Stats
              </h2>
              <p className="text-sm text-gray-400">
                Top contributors and activity trends
              </p>
            </div>
            <div className="lg:block">
              <StatisticsSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
