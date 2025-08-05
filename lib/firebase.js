import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";

// Environment-based Firebase configuration (always available)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let db;
let auth;

if (typeof window !== 'undefined') {
  // Client-side initialization
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    console.log('🔥 Firebase initialized successfully');
    
    // Initialize obfuscation system after Firebase is ready
    initializeFirebaseObfuscation();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
} else {
  // Server-side: Create placeholder objects to prevent import errors
  console.log('Firebase initialization skipped on server-side');
}

/**
 * Initialize Firebase URL obfuscation system (client-side only)
 */
async function initializeFirebaseObfuscation() {
  try {
    // Dynamic import to ensure client-side only
    const { default: FirebaseURLObfuscator } = await import('./firebase-url-obfuscator.js');
    const obfuscator = new FirebaseURLObfuscator();
    
    // Store the current Firebase config in obfuscated form
    if (firebaseConfig.apiKey) {
      const success = obfuscator.storeObfuscatedConfig(firebaseConfig);
      if (success) {
        console.log('🔒 Firebase configuration obfuscated and stored securely');
      }
    }
    
    // Initialize the storage cleaner
    const { default: firebaseCleaner } = await import('./firebase-storage-cleaner.js');
    console.log('🛡️ Firebase URL obfuscation system active');
    
  } catch (error) {
    console.error('Failed to initialize Firebase obfuscation:', error);
  }
}

// Firebase Authentication utilities
export const firebaseAuth = {
  // Sign in with custom token (for your existing user system)
  signInWithToken: async (customToken) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    try {
      const userCredential = await signInWithCustomToken(auth, customToken);
      return userCredential.user;
    } catch (error) {
      console.error('Firebase auth error:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
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
      console.warn('Firebase Auth not initialized');
      return () => {};
    }
    return auth.onAuthStateChanged(callback);
  }
};

// Export database and auth with safety checks
export { db, auth };
export default app;
