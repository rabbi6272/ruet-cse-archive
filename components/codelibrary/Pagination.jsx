"use client";

import { useCodeLibrary } from "./useCodeLibrary";

export function CodeLibraryPagination() {
  const {
    currentPage,
    totalPages,
    onPageChange = paginate,
    filteredSnippetsLength = filteredSnippets.length,
    snippetsPerPage = snippetsPerPage,
  } = useCodeLibrary();

  // Generate pagination numbers with ellipsis
  const generatePaginationNumbers = () => {
    const delta =
      typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 2; // Fewer pages on mobile
    const range = [];
    const rangeWithDots = [];

    // Always include first page
    range.push(1);

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Always include last page if there are more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add ellipsis where needed
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  if (filteredSnippetsLength <= snippetsPerPage) {
    return null;
  }

  return (
    <div className="flex justify-center mt-8">
      <nav className="inline-flex rounded-md shadow-sm overflow-hidden">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-2 md:px-3 py-2 text-sm md:text-base rounded-l-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 bg-white border-gray-300 text-gray-500 hover:bg-gray-50 ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">
            <i className="fas fa-chevron-left"></i>
          </span>
        </button>

        {/* Page numbers with ellipsis */}
        <div className="hidden xs:flex">
          {generatePaginationNumbers().map((item, index) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 md:px-3 py-2 text-sm md:text-base border-t border-b dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 bg-white border-gray-300 text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNumber = item;
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`px-2 md:px-3 py-2 text-sm md:text-base border-t border-b dark:bg-gray-800 dark:border-gray-700 ${
                  currentPage === pageNumber
                    ? "dark:text-blue-400 dark:bg-gray-700"
                    : "dark:text-gray-300 dark:hover:bg-gray-700"
                } bg-white border-gray-300 ${
                  currentPage === pageNumber
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Mobile page indicator */}
        <div className="xs:hidden flex items-center px-3 py-2 border-t border-b dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 bg-white border-gray-300 text-gray-500">
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-2 md:px-3 py-2 text-sm md:text-base rounded-r-md border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 bg-white border-gray-300 text-gray-500 hover:bg-gray-50 ${
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">
            <i className="fas fa-chevron-right"></i>
          </span>
        </button>
      </nav>
    </div>
  );
}
