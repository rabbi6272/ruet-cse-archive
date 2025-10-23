"use client";
import "highlight.js/styles/monokai.css";
import { lato } from "@/app/ui/fonts";

// Import the components
import { useCodeLibrary } from "./useCodeLibrary";
import SearchAndFilters from "./SearchAndFilters";
import SnippetCard from "./SnippetCard";
import StatisticsSidebar from "./StatisticsSidebar";
import Loading from "@/app/loading";

export function CodeLibraryBody({ initialSnippets = [] }) {
  // Use the custom hook with initial data
  const {
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
    copiedStates,
    snippetsPerPage,
    setSearchTerm,
    setLanguageFilter,
    setAuthorFilter,
    copyCode,
    toggleLike,
    toggleExpand,
    paginate,
  } = useCodeLibrary(initialSnippets);

  return (
    <div
      className={`${lato.className} min-h-screen transition-colors duration-300 `}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Main Layout - Split on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Left Side - Code Library Content (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <SearchAndFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              languageFilter={languageFilter}
              setLanguageFilter={setLanguageFilter}
              authorFilter={authorFilter}
              setAuthorFilter={setAuthorFilter}
              snippets={snippets}
            />

            {/* Snippet Cards */}
            <div className="space-y-6">
              {currentSnippets.length > 0 ? (
                currentSnippets.map((snippet) => (
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
                <div>
                  <Loading />
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Statistics Sidebar (1/3 width on large screens) */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2 sticky top-0 left-0">
            <div>
              <div className="mb-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="text-xl lg:text-2xl mr-2">📊</span>
                  Community Stats
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
    </div>
  );
}
