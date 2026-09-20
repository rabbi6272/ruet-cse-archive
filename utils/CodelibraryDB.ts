// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";
import { ReCaptchaV3Provider, initializeAppCheck } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_CODELIBRARY_FIREBASE_MEASUREMENT_ID,
};

//6LdIZ6YsAAAAAGs1frbDxpApqgsSUALGCF5gTA0u
//recaptcha site key

// Initialize Firebase
const CodelibraryApp = initializeApp(firebaseConfig, "codelibrary");
const CodelibraryDB = getFirestore(CodelibraryApp);
const CodelibraryAuth = getAuth(CodelibraryApp);
let authPromise: Promise<User | null> | null = null;

if (typeof window !== "undefined") {
  try {
    initializeAppCheck(CodelibraryApp, {
      provider: new ReCaptchaV3Provider(
        "6LdIZ6YsAAAAAGs1frbDxpApqgsSUALGCF5gTA0u",
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("App Check initialization skipped:", error);
  }
}

const COLLECTION = "codelibrary";

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Best-effort anonymous sign-in.
 *
 * Firestore rules for this project gate both reads and writes behind
 * `request.auth != null`, so this sign-in is required before every
 * Firestore operation. It must never throw: when Firebase Auth is not
 * enabled in the project (auth/configuration-not-found) it resolves null
 * so callers degrade gracefully instead of crashing. The failure is still
 * logged loudly because under the auth-gated rules an unauthenticated
 * caller will be denied by Firestore.
 */
async function ensureCodelibraryAuth(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const currentUser = CodelibraryAuth.currentUser;
  if (currentUser) return currentUser;

  try {
    authPromise ??= signInAnonymously(CodelibraryAuth)
      .then((credential) => credential.user)
      .catch((error) => {
        console.warn(
          "[codelibrary] Anonymous sign-in failed - Firestore operations will be denied by rules:",
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
      "[codelibrary] Anonymous sign-in failed - Firestore operations will be denied by rules:",
      describeError(error),
    );
    return null;
  }
}

export { CodelibraryAuth, CodelibraryDB, COLLECTION, ensureCodelibraryAuth };
