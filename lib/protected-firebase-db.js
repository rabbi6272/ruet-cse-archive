import { db, auth } from './firebase';
import AuthUtils from './auth-utils-secure';
import FirebaseAuthService from './firebase-auth-service';

/**
 * Protected Firebase Database Wrapper
 * Ensures all database operations require proper authentication
 */
class ProtectedFirebaseDB {
  
  /**
   * Initialize the protected database wrapper
   */
  static async initialize() {
    try {
      // Ensure Firebase Auth Service is initialized
      await FirebaseAuthService.initialize();
      
      // Check if user should be authenticated
      if (AuthUtils.isAuthenticated()) {
        const isValid = await FirebaseAuthService.validateSession();
        if (!isValid) {
          console.warn('🔒 Invalid session detected, blocking database access');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      console.error('Protected DB initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get protected database reference
   * Only returns database if user is properly authenticated
   */
  static async getDatabase() {
    try {
      // Check local authentication status
      if (!AuthUtils.isAuthenticated()) {
        throw new Error('User not authenticated locally');
      }
      
      // For development, we'll allow database access for authenticated local users
      // The Firebase database rules will still enforce server-side security
      const userData = AuthUtils.getUserData();
      if (!userData || !userData.roll) {
        throw new Error('Invalid user data');
      }
      
      // Check session validity
      if (!AuthUtils.isSessionValid()) {
        throw new Error('Session expired');
      }
      
      console.log('✅ Database access granted for user:', userData.roll);
      return db;
      
    } catch (error) {
      console.error('🔒 Database access denied:', error.message);
      
      // Clear invalid authentication
      await FirebaseAuthService.signOut();
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/user/login';
      }
      
      throw new Error('Authentication required for database access');
    }
  }
  
  /**
   * Protected database operations
   */
  static async ref(path) {
    const database = await this.getDatabase();
    const { ref } = await import('firebase/database');
    return ref(database, path);
  }
  
  static async get(path) {
    const database = await this.getDatabase();
    const { ref, get } = await import('firebase/database');
    return get(ref(database, path));
  }
  
  static async set(path, data) {
    const database = await this.getDatabase();
    const { ref, set } = await import('firebase/database');
    return set(ref(database, path), data);
  }
  
  static async update(path, data) {
    const database = await this.getDatabase();
    const { ref, update } = await import('firebase/database');
    return update(ref(database, path), data);
  }
  
  static async push(path, data) {
    const database = await this.getDatabase();
    const { ref, push } = await import('firebase/database');
    return push(ref(database, path), data);
  }
  
  static async remove(path) {
    const database = await this.getDatabase();
    const { ref, remove } = await import('firebase/database');
    return remove(ref(database, path));
  }
  
  static async onValue(path, callback, errorCallback) {
    const database = await this.getDatabase();
    const { ref, onValue } = await import('firebase/database');
    return onValue(ref(database, path), callback, errorCallback);
  }
  
  static async off(path, eventType, callback) {
    const database = await this.getDatabase();
    const { ref, off } = await import('firebase/database');
    return off(ref(database, path), eventType, callback);
  }
}

export default ProtectedFirebaseDB;
