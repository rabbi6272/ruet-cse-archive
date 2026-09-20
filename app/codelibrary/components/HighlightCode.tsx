"use client";

import { useRef, useEffect } from "react";
import hljs from "highlight.js";

type HighlightCodeProps = {
  code: string;
  language?: string;
  className?: string;
};

/**
 * A code block component that applies syntax highlighting via a ref,
 * scoped to this element only (not the entire DOM).
 */
export default function HighlightCode({
  code,
  language = "text",
  className = "",
}: HighlightCodeProps) {
  const codeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;

    // Reset any previous highlighting
    el.removeAttribute("data-highlighted");
    hljs.highlightElement(el);
  }, [code, language]);

  return (
    <pre className={`p-4 overflow-x-auto bg-gray-900 text-gray-100 rounded-b-xl ${className}`}>
      <code
        ref={codeRef}
        className={`language-${language.toLowerCase()} hljs`}
        style={{ background: "transparent" }}
      >
        {code}
      </code>
    </pre>
  );
}