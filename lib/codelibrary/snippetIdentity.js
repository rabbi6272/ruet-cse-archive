function asCleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function getStoredSnippetId(snippet) {
  if (!snippet || typeof snippet !== "object") return "";

  const candidates = [snippet.id, snippet.snippetId, snippet.uid];
  return candidates.find((value) => asCleanString(value)) ?? "";
}

export function getCanonicalSnippetId(snippet, fallbackRollNumber = "") {
  const storedId = getStoredSnippetId(snippet);
  if (storedId) return storedId;

  const rollNumber = asCleanString(snippet?.rollNumber) || asCleanString(fallbackRollNumber);
  const fingerprint = [
    rollNumber,
    asCleanString(snippet?.title),
    asCleanString(snippet?.date),
    asCleanString(snippet?.language),
    asCleanString(snippet?.description),
    asCleanString(snippet?.codeSnippet ?? snippet?.code),
  ].join("|");

  return `legacy_${rollNumber || "unknown"}_${hashString(fingerprint)}`;
}

export function decorateSnippet(snippet, fallbackRollNumber = "") {
  if (!snippet || typeof snippet !== "object") return snippet;

  const rollNumber = asCleanString(snippet.rollNumber) || asCleanString(fallbackRollNumber);

  return {
    ...snippet,
    id: getCanonicalSnippetId(snippet, rollNumber),
    rollNumber,
  };
}

export function normalizeSnippets(snippets, fallbackRollNumber = "") {
  if (!Array.isArray(snippets)) return [];
  return snippets.filter(Boolean).map((snippet) => decorateSnippet(snippet, fallbackRollNumber));
}

export function matchesSnippetId(snippet, targetId, fallbackRollNumber = "") {
  if (!targetId) return false;
  return getCanonicalSnippetId(snippet, fallbackRollNumber) === targetId;
}
