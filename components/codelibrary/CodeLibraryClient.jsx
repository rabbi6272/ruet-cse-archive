"use client";
import "highlight.js/styles/monokai.css";
import { lato } from "@/app/ui/fonts";

// Import the components
import { useCodeLibrary } from "./useCodeLibrary";
import LibraryHeader from "./LibraryHeader";
import SearchAndFilters from "./SearchAndFilters";
import SnippetCard from "./SnippetCard";
import Pagination from "./Pagination";

const CodeLibraryClient = ({ initialSnippets = [] }) => {
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <LibraryHeader />

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
            <div className="text-center py-10 dark:text-gray-400 text-gray-600">
              No snippets found matching your criteria
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          filteredSnippetsLength={filteredSnippets.length}
          snippetsPerPage={snippetsPerPage}
        />
      </div>
    </div>
  );
};

export default CodeLibraryClient;
