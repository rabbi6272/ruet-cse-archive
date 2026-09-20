import HighlightCode from "./HighlightCode";
import type { Snippet } from "./types";

type CodeDisplayProps = {
  snippet: Pick<Snippet, "id" | "language" | "codeSnippet">;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onCopyCode: (id: string, code: string) => void;
  copiedStates: Record<string, boolean>;
  maxCodeLines?: number;
};

const CodeDisplay = ({
  snippet,
  isExpanded,
  onToggleExpand,
  onCopyCode,
  copiedStates,
  maxCodeLines = 20,
}: CodeDisplayProps) => {
  const code = snippet.codeSnippet ?? "";

  const isCodeLong = code.split("\n").length > maxCodeLines;

  const displayCode =
    isCodeLong && !isExpanded
      ? code.split("\n").slice(0, maxCodeLines).join("\n") + "\n..."
      : code;

  return (
    <div className="code-container dark:bg-gray-900 bg-gray-200 mt-4 rounded-lg overflow-hidden relative group">
      {/* Copy button */}
      <button
        className={`copy-btn px-2 py-1 rounded text-xs absolute top-2 right-2 opacity-100 xl:opacity-0 transition-all duration-300 group-hover:opacity-100 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-white bg-gray-900 hover:bg-gray-800 text-white z-10 ${
          copiedStates[snippet.id] ? "bg-green-600 dark:bg-green-600" : ""
        }`}
        onClick={() => onCopyCode(snippet.id, code)}
      >
        <i
          className={`${
            copiedStates[snippet.id] ? "fas fa-check" : "far fa-copy"
          } mr-1`}
        ></i>
        {copiedStates[snippet.id] ? "Copied" : "Copy"}
      </button>

      {/* Code snippet with scoped highlighting */}
      <HighlightCode
        code={displayCode}
        language={snippet.language}
        className={isCodeLong && !isExpanded ? "max-h-70" : ""}
      />

      {/* Code expand button */}
      {isCodeLong && (
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