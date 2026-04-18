"use client";
// @ts-check
/** @typedef {import('./types').Snippet} Snippet */

import CommentSection from "./CommentSection";
import CodeDisplay from "./CodeDisplay";
import { getNameFromRoll } from "./useComments";
import { formatDate } from "./utils";

/**
 * @param {{
 *   snippet:        Snippet,
 *   isExpanded:     boolean,
 *   onToggleExpand: (id: string) => void,
 *   onToggleLike:   (id: string) => void,
 *   onCopyCode:     (id: string, code: string) => void,
 *   copiedStates:   Record<string, boolean>,
 *   animateLike:    Record<string, boolean>,
 * }} props
 */
const SnippetCard = ({
  snippet,
  isExpanded,
  onToggleExpand,
  onToggleLike,
  onCopyCode,
  copiedStates,
  animateLike,
}) => {
  return (
    <div className="rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 border dark:border-gray-700 bg-white border-gray-300">
      <div className="p-4 lg:p-5">
        <div className="flex justify-between items-start">
          <span className="inline-block text-xs px-2 py-1 rounded-full font-semibold uppercase dark:bg-blue-900 dark:text-blue-300 bg-blue-100 text-blue-800">
            {snippet.language}
          </span>
          <span className="text-xs dark:text-gray-400 text-gray-500">
            {formatDate(snippet.date)}
          </span>
        </div>

        <h3 className="mt-2 text-lg font-semibold dark:text-gray-100 text-gray-800">
          {snippet.title}
        </h3>
        <p className="mt-1 text-wrap dark:text-gray-400 text-gray-600">
          {snippet.description}
        </p>

        <CodeDisplay
          snippet={snippet}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onCopyCode={onCopyCode}
          copiedStates={copiedStates}
        />

        <div className="mt-4 flex justify-between items-center text-sm">
          <span className="font-medium dark:text-gray-400 text-gray-500">
            {getNameFromRoll(snippet.rollNumber)} ({snippet.rollNumber})
          </span>
          <div className="flex items-center space-x-2">
            <button
              className={`mr-2 ${snippet.isLiked ? "text-red-500" : "dark:text-gray-400 text-gray-500"} hover:text-red-500 ${animateLike[snippet.id] ? "animate-bounce" : ""}`}
              onClick={() => onToggleLike(snippet.id)}
            >
              <i className={`${snippet.isLiked ? "fas" : "far"} fa-heart`} />
            </button>
            <span className={`dark:text-gray-400 text-gray-600 ${animateLike[snippet.id] ? "animate-bounce" : ""}`}>
              {snippet.likesCount || 0} Likes
            </span>
          </div>
        </div>

        <CommentSection snippet={snippet} />
      </div>
    </div>
  );
};

export default SnippetCard;
