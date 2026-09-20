import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";

const comments_Config = {
  apiKey: "AIzaSyDwDAI1ZnSglcdnj-QZIi6AeKM2uykk7Is",
  authDomain: "cse-archive-comments.firebaseapp.com",
  databaseURL:
    "https://cse-archive-comments-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cse-archive-comments",
  storageBucket: "cse-archive-comments.firebasestorage.app",
  messagingSenderId: "300898904046",
  appId: "1:300898904046:web:e710b91c6a0e10e43810ff",
  measurementId: "G-YWMVW32FVK",
};

// Initialize Firebase
const CommentsApp = initializeApp(comments_Config, "comments");
const CommentsDB = getDatabase(CommentsApp);
const CommentsAuth = getAuth(CommentsApp);
let authPromise: Promise<User | null> | null = null;

const COLLECTION = "comments";

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Best-effort anonymous sign-in.
 *
 * Realtime Database rules for this project gate writes behind
 * `auth != null`, so this sign-in is required before every comment write.
 * It must never throw: when Anonymous Auth is not enabled in the project
 * (auth/operation-not-allowed, auth/configuration-not-found) it resolves
 * null so callers degrade gracefully instead of crashing. The failure is
 * still logged loudly because under the auth-gated write rule an
 * unauthenticated caller will be denied by the database.
 */
async function ensureCommentsAuth(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const currentUser = CommentsAuth.currentUser;
  if (currentUser) return currentUser;

  try {
    authPromise ??= signInAnonymously(CommentsAuth)
      .then((credential) => credential.user)
      .catch((error) => {
        console.warn(
          "[comments] Anonymous sign-in failed - comment writes will be denied by rules:",
          describeError(error),
        );
        return null;
      })
      .finally(() => {
        authPromise = null;
      });

    return await authPromise;
  } catch (error) {
    console.warn(
      "[comments] Anonymous sign-in failed - comment writes will be denied by rules:",
      describeError(error),
    );
    return null;
  }
}

export { CommentsAuth, CommentsDB, COLLECTION, ensureCommentsAuth };