// ─────────────────────────────────────────────────────────────────────────────
// Firestore schema
//
// Collection : "codelibrary"
// Document   : {rollNumber}   e.g. "2403272"
//   ├── rollNumber : string
//   └── snippets   : FirestoreSnippet[]
//         └── (each snippet)
//               ├── id, title, description, code, language, date, author?
//               ├── likesCount, copiesCount
//               └── comments : Comment[]
//                     └── (each comment)
//                           ├── id, authorRoll, text, createdAt, likes, likedBy, isEdited, editedAt?
//                           └── replies : Reply[]
//
// Notifications (Firestore — replaces RTDB)
// Collection : "notifications"
// Document   : {recipientRoll}
//   └── items : Notification[]
// ─────────────────────────────────────────────────────────────────────────────

export interface Reply {
  id: string;
  authorRoll: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  isEdited: boolean;
  likes: number;
  likedBy: Record<string, boolean>;
}

export interface Comment {
  id: string;
  authorRoll: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  isEdited: boolean;
  likes: number;
  likedBy: Record<string, boolean>;
  replies: Reply[];
}

/** Shape stored in Firestore — the raw array element inside a roll document. */
export interface FirestoreSnippet {
  id: string;
  rollNumber: string;
  title: string;
  description: string;
  code: string;
  language: string;
  date: string;
  author?: string;
  likesCount: number;
  copiesCount: number;
  comments: Comment[]; // ← embedded directly in the snippet
}

/** FirestoreSnippet enriched with client-side fields at read time. */
export interface Snippet extends FirestoreSnippet {
  isLiked: boolean; // derived from localStorage
  timestamp: number; // derived from date field
}

export interface AuthUser {
  roll: string;
  name: string;
  profilePictureUrl?: string;
}
