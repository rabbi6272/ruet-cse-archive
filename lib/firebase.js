import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  getAuth,
  signInWithCustomToken,
  signOut,
  signInAnonymously,
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Environment-based Firebase configuration (always available)
const firebaseConfig = {
  apiKey: "AIzaSyDcvagoN3Uv6PSTuXQg5uztf2tdiXl--dc",
  authDomain: "cse-archive-codes.firebaseapp.com",
  databaseURL: "https://cse-archive-codes-default-rtdb.firebaseio.com",
  projectId: "cse-archive-codes",
  storageBucket: "cse-archive-codes.firebasestorage.app",
  messagingSenderId: "15084195695",
  appId: "1:15084195695:web:21fad2e1a180645a79e29a",
  measurementId: "G-GMXJ26J8ET",
};

// Initialize Firebase
let app;
let db;
let auth;

if (typeof window !== "undefined") {
  // Client-side initialization
  try {
    app = initializeApp(firebaseConfig);

    // Initialize App Check
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        "6LcaL8wrAAAAANm1-f3A7gTQvcu_KtHW_SLMCOvo"
      ),
      isTokenAutoRefreshEnabled: true,
    });

    db = getDatabase(app);
    auth = getAuth(app);

    // Optional anonymous authentication for enhanced features
    // Public features work without authentication
    signInAnonymously(auth).catch((error) => {
      console.log(
        "Anonymous auth not required for public features:",
        error.message
      );
    });

    console.log(
      "🔥 Firebase initialized successfully with App Check and public access"
    );

    // Initialize obfuscation system after Firebase is ready
    initializeFirebaseObfuscation();
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    throw error;
  }
} else {
  // Server-side: Create placeholder objects to prevent import errors
  console.log("Firebase initialization skipped on server-side");
}

/**
 * Initialize Firebase URL obfuscation system (client-side only)
 */
async function initializeFirebaseObfuscation() {
  try {
    // Dynamic import to ensure client-side only
    const { default: FirebaseURLObfuscator } = await import(
      "./firebase-url-obfuscator.js"
    );
    const obfuscator = new FirebaseURLObfuscator();

    // Store the current Firebase config in obfuscated form
    if (firebaseConfig.apiKey) {
      const success = obfuscator.storeObfuscatedConfig(firebaseConfig);
      if (success) {
        console.log("🔒 Firebase configuration obfuscated and stored securely");
      }
    }

    // Initialize the storage cleaner
    const { default: firebaseCleaner } = await import(
      "./firebase-storage-cleaner.js"
    );
    console.log("🛡️ Firebase URL obfuscation system active");
  } catch (error) {
    console.error("Failed to initialize Firebase obfuscation:", error);
  }
}

// Firebase Authentication utilities
export const firebaseAuth = {
  // Sign in anonymously
  signInAnonymously: async () => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error("Anonymous auth error:", error);
      throw error;
    }
  },

  // Sign in with custom token (for your existing user system)
  signInWithToken: async (customToken) => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      const userCredential = await signInWithCustomToken(auth, customToken);
      return userCredential.user;
    } catch (error) {
      console.error("Firebase auth error:", error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    if (!auth) {
      throw new Error("Firebase Auth not initialized");
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign out error:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    if (!auth) return null;
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (!auth) {
      console.warn("Firebase Auth not initialized");
      return () => {};
    }
    return auth.onAuthStateChanged(callback);
  },
};

// Export database and auth with safety checks
export { db, auth };
export default app;
