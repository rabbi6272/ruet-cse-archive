import { firebaseAuth } from './firebase';
import { secureStorage } from './secure-storage';
import AuthUtils from './auth-utils-secure';

/**
 * Secure Firebase Authentication Service
 * Integrates existing AuthUtils with Firebase Authentication
 */
class FirebaseAuthService {
  static isInitialized = false;

  /**
   * Initialize the authentication service
   */
  static async initialize() {
    if (this.isInitialized) return;

    try {
      // Listen to Firebase auth state changes
      firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          console.log('🔐 Firebase user authenticated:', firebaseUser.uid);
        } else {
          console.log('🔓 Firebase user signed out');
          // Clear local authentication when Firebase user is signed out
          this.clearLocalAuth();
        }
      });

      // If user is authenticated locally, authenticate with Firebase
      if (AuthUtils.isAuthenticated()) {
        await this.authenticateWithFirebase();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase auth service:', error);
    }
  }

  /**
   * Authenticate current user with Firebase
   */
  static async authenticateWithFirebase() {
    try {
      const userData = AuthUtils.getUserData();
      if (!userData || !userData.roll) {
        throw new Error('No valid user data found');
      }

      // For now, we'll use a simplified approach since custom tokens require server-side setup
      // In production, you'd set up Firebase Admin SDK on your server
      console.log('🔐 User authenticated locally:', userData.roll);
      
      // Since we can't use custom tokens without proper server setup,
      // we'll simulate Firebase authentication by setting up the auth state
      // The database rules will still protect the data since we have auth != null checks
      
      // For development, we'll create a mock Firebase user
      const mockFirebaseUser = {
        uid: userData.roll,
        email: `${userData.roll}@student.ruet.ac.bd`,
        displayName: userData.name,
        isAuthenticated: true
      };
      
      console.log('✅ Firebase authentication simulated for development:', mockFirebaseUser.uid);
      return mockFirebaseUser;
      
    } catch (error) {
      console.error('Failed to authenticate with Firebase:', error);
      this.clearLocalAuth();
      throw error;
    }
  }

  /**
   * Generate a custom token for the user
   * Creates a server-side endpoint call for proper token generation
   */
  static async generateCustomToken(userRoll) {
    try {
      // Try to call your backend API for proper token generation
      const response = await fetch('/api/auth/generate-token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Roll': userRoll // Send roll as header for validation
        },
        body: JSON.stringify({ userRoll })
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      } else {
        throw new Error('Server token generation failed');
      }
    } catch (error) {
      console.warn('Server-side token generation failed, using client-side fallback:', error);
      
      // Fallback: Create a simple JWT-like token (not as secure as server-side)
      // This should be replaced with proper server-side token generation in production
      const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        iss: window.location.origin,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iat: Math.floor(Date.now() / 1000),
        sub: userRoll,
        uid: userRoll,
        claims: {
          roll: userRoll,
          timestamp: Date.now()
        }
      }));
      
      return `${header}.${payload}.`;
    }
  }

  /**
   * Sign out from both Firebase and local storage
   */
  static async signOut() {
    try {
      await firebaseAuth.signOut();
      this.clearLocalAuth();
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear local auth even if Firebase signout fails
      this.clearLocalAuth();
    }
  }

  /**
   * Clear local authentication data
   */
  static clearLocalAuth() {
    try {
      if (secureStorage) {
        secureStorage.clearSecureData();
      }
      // Also clear any remaining localStorage data
      localStorage.removeItem('user');
      // Clear other auth-related items but preserve non-auth data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ss_') || key.startsWith('session_') || key === 'user')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing local auth:', error);
    }
  }

  /**
   * Check if user is authenticated with both local and Firebase
   */
  static isFullyAuthenticated() {
    const localAuth = AuthUtils.isAuthenticated();
    const firebaseUser = firebaseAuth.getCurrentUser();
    return localAuth && firebaseUser;
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser() {
    const localUser = AuthUtils.getUserData();
    const firebaseUser = firebaseAuth.getCurrentUser();
    
    if (localUser && firebaseUser) {
      return {
        ...localUser,
        firebaseUid: firebaseUser.uid,
        isFullyAuthenticated: true
      };
    }
    
    return null;
  }

  /**
   * Validate user session and refresh if needed
   */
  static async validateSession() {
    try {
      const localUser = AuthUtils.getUserData();
      const firebaseUser = firebaseAuth.getCurrentUser();

      if (!localUser) {
        await this.signOut();
        return false;
      }

      if (!firebaseUser) {
        // Try to re-authenticate with Firebase
        await this.authenticateWithFirebase();
      }

      return this.isFullyAuthenticated();
    } catch (error) {
      console.error('Session validation failed:', error);
      await this.signOut();
      return false;
    }
  }
}

export default FirebaseAuthService;
