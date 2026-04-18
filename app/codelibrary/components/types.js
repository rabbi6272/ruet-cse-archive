/**
 * @fileoverview
 * Central JSDoc type definitions for the Code Library feature.
 * Import with:  @typedef {import('./types').Snippet} Snippet
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
 * Notifications (Firestore — replaces RTDB)
 * Collection : "notifications"
 * Document   : auto-id
 *   └── recipientRoll, message, type, relatedSnippetId, …
 */

/**
 * @typedef {Object} Reply
 * @property {string}                  id
 * @property {string}                  authorRoll
 * @property {string}                  text
 * @property {string}                  createdAt   - ISO date string
 * @property {string}                  [editedAt]
 * @property {boolean}                 isEdited
 * @property {number}                  likes
 * @property {Record<string, boolean>} likedBy     - keyed by rollNumber
 */

/**
 * @typedef {Object} Comment
 * @property {string}                  id
 * @property {string}                  authorRoll
 * @property {string}                  text
 * @property {string}                  createdAt
 * @property {string}                  [editedAt]
 * @property {boolean}                 isEdited
 * @property {number}                  likes
 * @property {Record<string, boolean>} likedBy
 * @property {Reply[]}                 replies
 */

/**
 * Raw shape stored in Firestore — one element of the `snippets` array.
 *
 * @typedef {Object} FirestoreSnippet
 * @property {string}    id
 * @property {string}    rollNumber
 * @property {string}    title
 * @property {string}    description
 * @property {string}    code
 * @property {string}    language
 * @property {string}    date
 * @property {string}    [author]
 * @property {number}    likesCount
 * @property {number}    copiesCount
 * @property {Comment[]} comments     - embedded directly in the snippet
 */

/**
 * FirestoreSnippet enriched with client-side fields at read time.
 *
 * @typedef {FirestoreSnippet & { isLiked: boolean, timestamp: number }} Snippet
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} roll
 * @property {string} name
 */

// This file has no runtime exports — it exists purely for JSDoc type references.
export {};
