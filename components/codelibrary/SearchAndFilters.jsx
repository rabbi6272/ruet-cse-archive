"use client";

const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  languageFilter,
  setLanguageFilter,
  authorFilter,
  setAuthorFilter,
  snippets,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-white border-gray-300 text-gray-700"
        />
        <button className="absolute right-3 top-2 dark:text-gray-400 dark:hover:text-gray-300 text-gray-400 hover:text-gray-500">
          <i className="fas fa-search"></i>
        </button>
      </div>
      <div className="flex gap-4">
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 bg-white border-gray-300 text-gray-500"
        >
          <option value="">All Languages</option>
          {Array.from(
            new Set(snippets.map((s) => s.language).filter(Boolean))
          ).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchAndFilters;
