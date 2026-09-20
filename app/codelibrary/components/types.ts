/**
 * Central type definitions for the Code Library feature.
 *
 * Firestore schema
 * ─────────────────
 * Collection : "codelibrary"
 * Document   : {rollNumber}   e.g. "2403272"
 *   ├── rollNumber : string
 *   └── snippets   : FirestoreSnippet[]
 *         └── (each snippet)
 *               ├── id, title, description, code, language, date, author?
 *               ├── likesCount, copiesCount
 *               └── comments : Comment[]
 *                     └── (each comment)
 *                           ├── id, authorRoll, text, createdAt, likes, likedBy, isEdited, editedAt?
 *                           └── replies : Reply[]
 *
 * Notifications (Firestore)
 * Collection : "notifications"
 * Document   : auto-id
 *   └── recipientRoll, message, type, relatedSnippetId, …
 */
import type { AuthUser, Comment, Reply } from "./commentTypes";

export type { AuthUser, Comment, Reply };

/**
 * Raw shape stored in Firestore — one element of the `snippets` array.
 * Most fields are optional because legacy documents may be missing them.
 */
export type FirestoreSnippet = {
  id: string;
  rollNumber: string;
  title?: string;
  description?: string;
  code?: string;
  codeSnippet?: string;
  language?: string;
  date?: string;
  lastModified?: string;
  author?: string;
  isLiked?: boolean;
  difficulty?: string;
  tags?: string[];
  likesCount?: number;
  copiesCount?: number;
  comments?: Comment[];
};

/**
 * FirestoreSnippet enriched with client-side fields at read time.
 */
export type Snippet = FirestoreSnippet & {
  isLiked: boolean;
  timestamp: number;
};