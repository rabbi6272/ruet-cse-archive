"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import toast, { Toaster } from "react-hot-toast";

const DoubtsArchive = () => {
  const [doubts, setDoubts] = useState([]);
  const [filteredDoubts, setFilteredDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDoubt, setExpandedDoubt] = useState(null);

  const ITEMS_PER_PAGE = 5;

  const categories = [
    "Environment bug",
    "Code not running", 
    "Compiler error",
    "Debug my code",
    "Give me hint",
    "Explain the idea",
    "Explain the code"
  ];

  useEffect(() => {
    loadResolvedDoubts();
  }, []);

  useEffect(() => {
    filterDoubts();
  }, [doubts, searchQuery, selectedCategory]);

  const loadResolvedDoubts = () => {
    setLoading(true);
    try {
      const resolvedDoubtsRef = ref(db, "resolvedDoubts");
      onValue(resolvedDoubtsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const doubtsArray = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .sort((a, b) => (b.solution?.solvedAt || b.timestamp) - (a.solution?.solvedAt || a.timestamp));
          
          setDoubts(doubtsArray);
        } else {
          setDoubts([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error loading resolved doubts:", error);
      toast.error("Failed to load doubts archive");
      setLoading(false);
    }
  };

  const filterDoubts = () => {
    let filtered = doubts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doubt => 
        doubt.title.toLowerCase().includes(query) ||
        doubt.description.toLowerCase().includes(query) ||
        doubt.solution?.content.toLowerCase().includes(query) ||
        doubt.userDetails.name.toLowerCase().includes(query) ||
        doubt.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doubt => doubt.category === selectedCategory);
    }

    setFilteredDoubts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Environment bug": "bg-red-100 text-red-800",
      "Code not running": "bg-orange-100 text-orange-800",
      "Compiler error": "bg-yellow-100 text-yellow-800",
      "Debug my code": "bg-blue-100 text-blue-800",
      "Give me hint": "bg-green-100 text-green-800",
      "Explain the idea": "bg-purple-100 text-purple-800",
      "Explain the code": "bg-pink-100 text-pink-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Pagination
  const totalPages = Math.ceil(filteredDoubts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDoubts = filteredDoubts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doubts Archive</h1>
          <p className="text-gray-600">Browse through resolved coding doubts and solutions</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Box */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Doubts
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, solution, or student name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            {loading ? "Loading..." : `${filteredDoubts.length} doubts found`}
          </div>
        </div>

        {/* Doubts List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg text-gray-600">Loading doubts...</div>
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No doubts found</h2>
            <p className="text-gray-500">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria" 
                : "No resolved doubts available yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentDoubts.map((doubt) => (
                <div key={doubt.id} className="bg-white rounded-lg shadow-md border-l-4 border-green-500">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">{doubt.title}</h2>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doubt.category)}`}>
                          {doubt.category}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedDoubt(expandedDoubt === doubt.id ? null : doubt.id)}
                        className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        {expandedDoubt === doubt.id ? "Collapse" : "Expand"}
                      </button>
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                      <div>
                        <strong>Student:</strong> {doubt.userDetails.name}
                      </div>
                      <div>
                        <strong>Roll:</strong> {doubt.userDetails.roll}
                      </div>
                      <div>
                        <strong>Asked:</strong> {formatDate(doubt.timestamp)}
                      </div>
                      <div>
                        <strong>Solved by:</strong> {doubt.solution?.solvedBy?.name}
                      </div>
                    </div>

                    {/* Problem Description (Always visible) */}
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 mb-2">Problem:</h3>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {doubt.description}
                        </p>
                      </div>
                    </div>

                    {/* Solution Preview */}
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 mb-2">Solution:</h3>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {doubt.solution?.content}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedDoubt === doubt.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        {/* Full Problem Description */}
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 mb-2">Full Problem Description:</h3>
                          <div className="bg-gray-50 p-4 rounded border">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {doubt.description}
                            </p>
                          </div>
                        </div>

                        {/* Attachment */}
                        {doubt.attachment && (
                          <div className="mb-6">
                            <h3 className="font-medium text-gray-700 mb-2">Code Attachment:</h3>
                            <div className="bg-gray-50 p-4 rounded border">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                📎 {doubt.attachment.name}
                              </p>
                              <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {doubt.attachment.content}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Full Solution */}
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 mb-2">Complete Solution:</h3>
                          <div className="bg-green-50 p-4 rounded border border-green-200">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {doubt.solution?.content}
                            </p>
                          </div>
                        </div>

                        {/* Solution Details */}
                        <div className="text-sm text-gray-500">
                          <p>
                            Solved by <strong>{doubt.solution?.solvedBy?.name}</strong> ({doubt.solution?.solvedBy?.roll}) 
                            on {formatDate(doubt.solution?.solvedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50 border"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoubtsArchive;
