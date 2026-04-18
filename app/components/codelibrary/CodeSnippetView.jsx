"use client";
import { useEffect } from "react";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/monokai.css";
import toast, { Toaster } from "react-hot-toast";
import CommentSection from "./CommentSection";
import { users } from "@/db/students_info";

function getNameFromRoll(roll) {
  const user = users.find((u) => u.roll === roll);
  if (!user) {
    return "User not found";
  }
  const formattedName = user.name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return formattedName;
}

export function CodeSnippetView({ codeSnap }) {
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
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: codeSnap.title,
            description: codeSnap.description,
            author: {
              "@type": "Person",
              name: getNameFromRoll(codeSnap.rollNumber),
              identifier: codeSnap.rollNumber,
            },
            datePublished: codeSnap.date,
            dateModified: codeSnap.lastModified || codeSnap.date,
            publisher: {
              "@type": "Organization",
              name: "RUET CSE Archive",
              logo: {
                "@type": "ImageObject",
                url: "https://csearchive.vercel.app/icon.png",
              },
            },
            articleSection: "Programming",
            keywords:
              codeSnap.tags?.join(", ") ||
              `${codeSnap.language}, programming, code`,
            about: {
              "@type": "Thing",
              name: codeSnap.language,
              description: `${codeSnap.language} programming language`,
            },
            programmingLanguage: codeSnap.language,
            codeRepository: "https://csearchive.vercel.app/codelibrary",
            educationalUse: "instruction",
            audience: {
              "@type": "EducationalAudience",
              educationalRole: "student",
            },
          }),
        }}
      />

      <div className="min-h-screen py-8">
        <Toaster />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation for SEO */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link
                  href="/"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
                <Link
                  href="/codelibrary"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Code Library
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
                <span
                  className="text-gray-700 dark:text-gray-300"
                  aria-current="page"
                >
                  {codeSnap.title}
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <Link
              href="/codelibrary"
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Code Library
            </Link>

            <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <header>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {codeSnap.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                        {codeSnap.language || "Unknown"}
                      </span>
                      {codeSnap.difficulty && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                          {codeSnap.difficulty}
                        </span>
                      )}
                      <time
                        className="text-gray-500 dark:text-gray-400 text-sm"
                        dateTime={codeSnap.date}
                      >
                        <i className="fas fa-calendar mr-1"></i>
                        {codeSnap.date
                          ? new Date(codeSnap.date).toLocaleDateString()
                          : "Unknown date"}
                      </time>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        <i className="fas fa-user mr-1"></i>
                        By: {getNameFromRoll(codeSnap.rollNumber)} (
                        {codeSnap.rollNumber})
                      </span>
                    </div>
                  </header>

                  {codeSnap.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed text-wrap">
                      {codeSnap.description}
                    </p>
                  )}
                </div>

                <aside className="flex flex-col sm:flex-row lg:flex-col gap-2">
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
                </aside>
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
            </article>
          </div>

          {/* Code Display */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
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
                  aria-label="Copy code to clipboard"
                >
                  <i className="fas fa-clipboard"></i>
                  Copy Code
                </button>
              </div>
            </div>

            <div className="relative">
              <pre
                className="p-6 overflow-x-auto bg-gray-900 text-gray-100 rounded-b-xl"
                role="region"
                aria-label="Code snippet"
              >
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
          </section>

          {/* Comments Section */}
          <section className="mt-8">
            <CommentSection
              snippet={{
                id: codeSnap.id || codeSnap.snippetId || codeSnap.uid,
                rollNumber: codeSnap.rollNumber,
                title: codeSnap.title,
              }}
            />
          </section>
        </div>
      </div>
    </>
  );
}
