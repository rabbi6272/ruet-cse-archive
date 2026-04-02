const CodeDisplay = ({
  snippet,
  isExpanded,
  onToggleExpand,
  onCopyCode,
  copiedStates,
  maxCodeLines = 20,
}) => {
  const isCodeLong = (code) => {
    return code?.split("\n").length > maxCodeLines;
  };

  return (
    <div className="code-container dark:bg-gray-900 bg-gray-200 mt-4 rounded-lg overflow-hidden relative group">
      {/* Copy button */}
      <button
        className={`copy-btn px-2 py-1 rounded text-xs absolute top-2 right-2 opacity-100 xl:opacity-0 transition-all duration-300 group-hover:opacity-100 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-white bg-gray-900 hover:bg-gray-800 text-white ${
          copiedStates[snippet.id] ? "bg-green-600 dark:bg-green-600" : ""
        }`}
        onClick={() => onCopyCode(snippet.id, snippet.codeSnippet)}
      >
        <i
          className={`${
            copiedStates[snippet.id] ? "fas fa-check" : "far fa-copy"
          } mr-1`}
        ></i>
        {copiedStates[snippet.id] ? "Copied" : "Copy"}
      </button>

      {/* Code snippet */}
      <pre
        className={`p-4 overflow-x-auto transition-transform duration-500 ${
          isCodeLong(snippet.codeSnippet) && !isExpanded ? "max-h-70" : ""
        }`}
      >
        <code
          className={`language-${snippet.language?.toLowerCase() || "text"}`}
        >
          {isCodeLong(snippet.codeSnippet) && !isExpanded
            ? snippet.codeSnippet
                .split("\n")
                .slice(0, maxCodeLines)
                .join("\n") + "\n..."
            : snippet.codeSnippet}
        </code>
      </pre>

      {/* Code expand button */}
      {isCodeLong(snippet.codeSnippet) && (
        <div className="flex justify-center p-2">
          <button
            className="px-6 py-2 text-sm font-medium rounded-full mx-auto dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 bg-gray-300 hover:bg-gray-400 text-gray-600 transition-colors duration-300"
            onClick={() => onToggleExpand(snippet.id)}
          >
            {isExpanded ? "Collapse " : "Expand "}
            Code
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeDisplay;
