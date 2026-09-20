export type SnippetLike = {
  id?: string;
  snippetId?: string;
  uid?: string;
  rollNumber?: string;
  title?: string;
  description?: string;
  code?: string;
  codeSnippet?: string;
  language?: string;
  date?: string;
  lastModified?: string;
  author?: string;
  isLiked?: boolean;
  likesCount?: number;
  copiesCount?: number;
  comments?: unknown[];
  tags?: string[];
  difficulty?: string;
  [key: string]: unknown;
};

export type DecodedSnippet = SnippetLike & {
  id: string;
  rollNumber: string;
};

function asCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function getStoredSnippetId(
  snippet: SnippetLike | null | undefined,
): string {
  if (!snippet || typeof snippet !== "object") return "";

  const candidates = [snippet.id, snippet.snippetId, snippet.uid];
  return candidates.find((value) => asCleanString(value)) ?? "";
}

export function getCanonicalSnippetId(
  snippet: SnippetLike | null | undefined,
  fallbackRollNumber = "",
): string {
  const storedId = getStoredSnippetId(snippet);
  if (storedId) return storedId;

  const rollNumber =
    asCleanString(snippet?.rollNumber) || asCleanString(fallbackRollNumber);
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

export function decorateSnippet(
  snippet: SnippetLike,
  fallbackRollNumber = "",
): DecodedSnippet {
  const rollNumber =
    asCleanString(snippet.rollNumber) || asCleanString(fallbackRollNumber);

  return {
    ...snippet,
    id: getCanonicalSnippetId(snippet, rollNumber),
    rollNumber,
  };
}

export function normalizeSnippets(
  snippets: unknown,
  fallbackRollNumber = "",
): DecodedSnippet[] {
  if (!Array.isArray(snippets)) return [];
  return snippets
    .filter(Boolean)
    .map((snippet) => decorateSnippet(snippet, fallbackRollNumber));
}

export function matchesSnippetId(
  snippet: SnippetLike,
  targetId: string,
  fallbackRollNumber = "",
): boolean {
  if (!targetId) return false;
  return getCanonicalSnippetId(snippet, fallbackRollNumber) === targetId;
}