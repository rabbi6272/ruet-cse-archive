import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <Card className="bg-muted/50 overflow-hidden relative group">
      {/* Copy button */}
      <Button
        variant={copiedStates[snippet.id] ? "default" : "secondary"}
        size="sm"
        className={`absolute top-2 right-2 opacity-100 xl:opacity-0 transition-all duration-300 group-hover:opacity-100 z-10 ${
          copiedStates[snippet.id] ? "bg-green-600 hover:bg-green-700" : ""
        }`}
        onClick={() => onCopyCode(snippet.id, snippet.codeSnippet)}
      >
        <FontAwesomeIcon
          icon={copiedStates[snippet.id] ? faCheck : faCopy}
          className="h-3 w-3 mr-1"
        />
        {copiedStates[snippet.id] ? "Copied" : "Copy"}
      </Button>

      {/* Code snippet */}
      <pre
        className={`p-4 overflow-x-auto transition-all duration-500 text-sm bg-background/50 ${
          isCodeLong(snippet.codeSnippet) && !isExpanded 
            ? "max-h-72 overflow-hidden" 
            : ""
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
        <div className="flex justify-center p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onToggleExpand(snippet.id)}
          >
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="h-3 w-3"
            />
            {isExpanded ? "Collapse" : "Expand"} Code
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CodeDisplay;
