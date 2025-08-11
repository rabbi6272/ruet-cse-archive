/**
 * Firebase URL Cleaner and Obfuscation Initializer
 * Removes any existing Firebase URLs from browser storage and sets up obfuscation
 */

import FirebaseURLObfuscator from "./firebase-url-obfuscator.js";

class FirebaseStorageCleaner {
  constructor() {
    this.obfuscator = new FirebaseURLObfuscator();
  }

  /**
   * Scan and remove any Firebase URLs from localStorage
   */
  cleanExistingFirebaseData() {
    if (typeof window === "undefined") return;

    const firebasePatterns = [
      /firebase/i,
      /firebaseio\.com/i,
      /googleapis\.com/i,
      /firebase-project/i,
      /firebase-config/i,
      /last-197cd/i, // Your specific project
      /s-usc1a-nss-/i, // The specific URL you mentioned
    ];

    const keysToRemove = [];

    // Scan localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);

      // Check key names
      const keyMatches = firebasePatterns.some((pattern) => pattern.test(key));

      // Check values for Firebase URLs
      const valueMatches = firebasePatterns.some((pattern) =>
        pattern.test(value)
      );

      if (keyMatches || valueMatches) {
        keysToRemove.push(key);
      }
    }

    // Remove identified Firebase data
    keysToRemove.forEach((key) => {
      console.log(`🧹 Removing Firebase data from key: ${key}`);
      localStorage.removeItem(key);
    });

    // Also scan sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);

      const keyMatches = firebasePatterns.some((pattern) => pattern.test(key));
      const valueMatches = firebasePatterns.some((pattern) =>
        pattern.test(value)
      );

      if (keyMatches || valueMatches) {
        // console.log(`🧹 Removing Firebase data from sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
      }
    }

    // console.log(`🔒 Cleaned ${keysToRemove.length} Firebase entries from browser storage`);
  }

  /**
   * Intercept and obfuscate any Firebase SDK storage operations
   */
  interceptFirebaseStorage() {
    if (typeof window === "undefined") return;

    // Override localStorage.setItem to intercept Firebase data
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);

    localStorage.setItem = (key, value) => {
      // Check if this is Firebase-related data
      const firebasePatterns = [/firebase/i, /firebaseio\.com/i, /last-197cd/i];

      const isFirebaseData = firebasePatterns.some(
        (pattern) => pattern.test(key) || pattern.test(value)
      );

      if (isFirebaseData) {
        // Obfuscate the key and value
        const obfuscatedKey = this.obfuscator.advancedHash(
          key,
          "storage_key_salt"
        );
        const obfuscatedValue = this.obfuscator.xorEncrypt(
          value,
          "storage_value_key"
        );

        // console.log(`🔒 Intercepted and obfuscated Firebase storage: ${key}`);
        return originalSetItem(obfuscatedKey, obfuscatedValue);
      }

      return originalSetItem(key, value);
    };

    localStorage.getItem = (key) => {
      // Check if we're trying to get obfuscated Firebase data
      const obfuscatedKey = this.obfuscator.advancedHash(
        key,
        "storage_key_salt"
      );
      const obfuscatedValue = originalGetItem(obfuscatedKey);

      if (obfuscatedValue) {
        const deobfuscatedValue = this.obfuscator.xorDecrypt(
          obfuscatedValue,
          "storage_value_key"
        );
        if (deobfuscatedValue) {
          // console.log(`🔓 Retrieved obfuscated Firebase data for: ${key}`);
          return deobfuscatedValue;
        }
      }

      return originalGetItem(key);
    };

    // console.log('🛡️ Firebase storage interception active');
  }

  /**
   * Monitor and clean Firebase URLs that appear in real-time
   */
  startFirebaseMonitoring() {
    if (typeof window === "undefined") return;

    // Monitor for new localStorage entries
    const observer = new MutationObserver(() => {
      this.cleanExistingFirebaseData();
    });

    // Monitor DOM changes that might indicate Firebase activity
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Periodic cleanup every 30 seconds
    setInterval(() => {
      this.cleanExistingFirebaseData();
    }, 30000);

    // console.log('👁️ Firebase monitoring started');
  }

  /**
   * Complete Firebase obfuscation setup
   */
  initializeCompleteObfuscation() {
    // console.log('🚀 Initializing complete Firebase URL obfuscation...');

    // Step 1: Clean existing data
    this.cleanExistingFirebaseData();

    // Step 2: Set up storage interception
    this.interceptFirebaseStorage();

    // Step 3: Start monitoring
    this.startFirebaseMonitoring();

    // Step 4: Override console methods to prevent URL leakage
    this.preventConsoleLeakage();

    // console.log('✅ Complete Firebase URL obfuscation active');
  }

  /**
   * Prevent Firebase URLs from appearing in console logs
   */
  preventConsoleLeakage() {
    if (typeof window === "undefined") return;

    const originalConsoleLog = console.log.bind(console);
    const originalConsoleError = console.error.bind(console);
    const originalConsoleWarn = console.warn.bind(console);

    const obfuscateFirebaseInMessage = (message) => {
      if (typeof message === "string") {
        return message
          .replace(
            /https:\/\/[\w-]+-default-rtdb\.firebaseio\.com/g,
            "[FIREBASE_DB_OBFUSCATED]"
          )
          .replace(/[\w-]+\.firebaseapp\.com/g, "[FIREBASE_APP_OBFUSCATED]")
          .replace(/last-197cd/g, "[PROJECT_ID_OBFUSCATED]")
          .replace(
            /s-usc1a-nss-[\d-]+\.firebaseio\.com/g,
            "[FIREBASE_HOST_OBFUSCATED]"
          );
      }
      return message;
    };

    console.log = (...args) => {
      const obfuscatedArgs = args.map(obfuscateFirebaseInMessage);
      return originalConsoleLog(...obfuscatedArgs);
    };

    console.error = (...args) => {
      const obfuscatedArgs = args.map(obfuscateFirebaseInMessage);
      return originalConsoleError(...obfuscatedArgs);
    };

    console.warn = (...args) => {
      const obfuscatedArgs = args.map(obfuscateFirebaseInMessage);
      return originalConsoleWarn(...obfuscatedArgs);
    };

    // console.log('🤫 Console Firebase URL obfuscation active');
  }
}

// Initialize the cleaner and obfuscation system
const firebaseCleaner = new FirebaseStorageCleaner();

// Auto-initialize on client side
if (typeof window !== "undefined") {
  // Initialize immediately
  firebaseCleaner.initializeCompleteObfuscation();

  // Also initialize on page load to catch any delayed Firebase operations
  window.addEventListener("load", () => {
    setTimeout(() => {
      firebaseCleaner.cleanExistingFirebaseData();
    }, 2000);
  });
}

export default firebaseCleaner;
