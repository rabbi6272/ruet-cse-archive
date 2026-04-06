"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";
import toast, { Toaster } from "react-hot-toast";
import CommentSection from "@/app/components/codelibrary/CommentSection";

export default function CodeSnapPage() {
  const { id } = useParams();
  const [codeSnap, setCodeSnap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCodeSnap() {
      try {
        if (!id) {
          throw new Error("Code snippet ID is required");
        }

        const response = await fetch(`/api/codesnap/${id}`);
        if (!response.ok) {
          throw new Error("Code snippet not found");
        }

        const snippetData = await response.json();
        setCodeSnap({
          ...snippetData,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchCodeSnap();
  }, [id]);

  // Highlight code after component renders
  useEffect(() => {
    if (codeSnap && codeSnap.codeSnippet) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const codeBlocks = document.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
          // Remove existing highlighting
          block.removeAttribute("data-highlighted");
          block.className = block.className.replace(/hljs[^\s]*/g, "").trim();
          // Apply new highlighting
          hljs.highlightElement(block);
        });
      }, 100);
    }
  }, [codeSnap]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link
            href="/codelibrary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Code Library
          </Link>
        </div>
      </div>
    );
  }

  if (!codeSnap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">
            📄 No code snippet found
          </div>
          <Link
            href="/codelibrary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Code Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-8">
      <Toaster />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/codelibrary"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-4"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Code Library
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {codeSnap.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                    {codeSnap.language || "Unknown"}
                  </span>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    {codeSnap.difficulty || "Not Specified"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    <i className="fas fa-calendar mr-1"></i>
                    {codeSnap.date
                      ? new Date(codeSnap.date).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    <i className="fas fa-user mr-1"></i>
                    Roll: {codeSnap.rollNumber || "Unknown"}
                  </span>
                </div>

                {codeSnap.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed text-wrap">
                    {codeSnap.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                {codeSnap.likesCount !== undefined && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg">
                    <i className="fas fa-heart"></i>
                    <span className="font-medium">
                      {codeSnap.likesCount} likes
                    </span>
                  </div>
                )}
                {codeSnap.copiesCount !== undefined && (
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg">
                    <i className="fas fa-copy"></i>
                    <span className="font-medium">
                      {codeSnap.copiesCount} copies
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {codeSnap.tags && codeSnap.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {codeSnap.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <i className="fas fa-code mr-2"></i>
                Source Code
              </h2>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      codeSnap.codeSnippet || codeSnap.code || "",
                    );
                    toast.success("Code copied to clipboard!");
                  } catch (err) {
                    toast.error("Failed to copy code");
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="fas fa-clipboard"></i>
                Copy Code
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-6 overflow-x-auto bg-gray-900 text-gray-100 rounded-b-xl">
              <code
                className={`language-${(
                  codeSnap.language || "text"
                ).toLowerCase()} hljs`}
                style={{ background: "transparent" }}
              >
                {codeSnap.codeSnippet || codeSnap.code || "No code available"}
              </code>
            </pre>
          </div>
        </div>

        {/* Comments Section - Advanced Component */}
        <CommentSection
          snippetId={id}
          snippetAuthor={codeSnap.rollNumber}
          snippetTitle={codeSnap.title}
        />
      </div>
    </div>
  );
}
