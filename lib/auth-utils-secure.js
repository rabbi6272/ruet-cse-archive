import { secureStorage } from './secure-storage';

/**
 * Authentication utility that handles both legacy and secure user data
 * This provides backward compatibility while transitioning to secure storage
 */
class AuthUtils {
  
  /**
   * Get user data from secure storage
   * Falls back to legacy localStorage if secure data doesn't exist
   * @returns {Object|null} User data or null if not authenticated
   */
  static getUserData() {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined' || !secureStorage) {
        return null;
      }

      // First, try to get data from secure storage
      const secureData = secureStorage.getSecureUserData();
      
      if (secureData && secureData.roll && secureData.name) {
        // Ensure the data has the correct types and values
        return {
          roll: String(secureData.roll),
          name: String(secureData.name),
          expiry: Number(secureData.expiry)
        };
      }
      
      // Fallback to legacy localStorage (for migration)
      const legacyData = localStorage.getItem("user");
      if (legacyData) {
        const userData = JSON.parse(legacyData);
        
        // Check if legacy data is still valid (not expired)
        if (userData.expiry && new Date().getTime() < userData.expiry) {
          console.log("📦 Found legacy user data, migrating to secure storage...");
          
          // Migrate to secure storage
          const migrationSuccess = secureStorage.setSecureUserData(userData);
          if (migrationSuccess) {
            // Remove legacy data after successful migration
            localStorage.removeItem("user");
            console.log("✅ Successfully migrated to secure storage");
            return {
              roll: String(userData.roll),
              name: String(userData.name),
              expiry: Number(userData.expiry)
            };
          }
        } else {
          // Legacy data expired, clean it up
          localStorage.removeItem("user");
          console.log("🕐 Legacy data expired and removed");
        }
      }
      
      return null;
    } catch (error) {
      console.error("❌ Error getting user data:", error);
      return null;
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated and session is valid
   */
  static isAuthenticated() {
    const userData = this.getUserData();
    return userData !== null && userData.roll && userData.name;
  }
  
  /**
   * Get user roll number
   * @returns {string|null} User roll number or null if not authenticated
   */
  static getUserRoll() {
    try {
      // Try to get from secure storage first
      const roll = secureStorage.getUserField('roll');
      if (roll) {
        return String(roll);
      }
      
      // Fallback to full user data
      const userData = this.getUserData();
      return userData ? String(userData.roll) : null;
    } catch (error) {
      console.error("❌ Error getting user roll:", error);
      return null;
    }
  }
  
  /**
   * Get user name
   * @returns {string|null} User name or null if not authenticated
   */
  static getUserName() {
    try {
      // Try to get from secure storage first
      const name = secureStorage.getUserField('name');
      if (name) {
        return String(name);
      }
      
      // Fallback to full user data
      const userData = this.getUserData();
      return userData ? String(userData.name) : null;
    } catch (error) {
      console.error("❌ Error getting user name:", error);
      return null;
    }
  }
  
  /**
   * Check if current user is admin
   * @returns {boolean} True if user is admin
   */
  static isAdmin() {
    try {
      const userRoll = this.getUserRoll();
      return userRoll === "2403172" || userRoll === "2403142"; // Rabbi or Bitto
    } catch (error) {
      console.error("❌ Error checking admin status:", error);
      return false;
    }
  }
  
  /**
   * Logout user by clearing all stored data
   */
  static logout() {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Clear secure storage
      if (secureStorage) {
        secureStorage.clearSecureData();
      }
      
      // Clear any remaining legacy data
      localStorage.removeItem("user");
      
      // Clear other user-related data
      localStorage.removeItem("pikachu_chat_history");
      localStorage.removeItem("pikachu_message_quota");
      
      console.log("👋 User logged out successfully");
      return true;
    } catch (error) {
      console.error("❌ Error during logout:", error);
      return false;
    }
  }
  
  /**
   * Check session validity
   * @returns {boolean} True if session is still valid
   */
  static isSessionValid() {
    try {
      // Check using secure storage session validation
      if (secureStorage.isSessionValid && secureStorage.isSessionValid()) {
        return true;
      }
      
      // Fallback: check user data expiry
      const userData = this.getUserData();
      
      if (!userData || !userData.expiry) {
        return false;
      }
      
      const currentTime = new Date().getTime();
      const isValid = currentTime < userData.expiry;
      
      if (!isValid) {
        console.log("🕐 Session expired, logging out...");
        this.logout();
      }
      
      return isValid;
    } catch (error) {
      console.error("❌ Error checking session validity:", error);
      return false;
    }
  }
  
  /**
   * Refresh user session (extend expiry time)
   * @returns {boolean} True if session was refreshed successfully
   */
  static refreshSession() {
    try {
      const userData = this.getUserData();
      if (!userData) return false;
      
      // Extend expiry by 24 hours
      const newExpiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
      const updatedUserData = {
        ...userData,
        expiry: newExpiryTime
      };
      
      const success = secureStorage.setSecureUserData(updatedUserData);
      if (success) {
        console.log("🔄 Session refreshed successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
      return false;
    }
  }
  
  /**
   * Store user data securely
   * @param {Object} userData - User data to store
   * @returns {boolean} True if data was stored successfully
   */
  static setUserData(userData) {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined' || !secureStorage) {
        return false;
      }

      const success = secureStorage.setSecureUserData(userData);
      if (success) {
        console.log("✅ User data stored securely");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error storing user data:", error);
      return false;
    }
  }
  
  /**
   * Get storage statistics for debugging
   * @returns {Object} Storage information
   */
  static getStorageInfo() {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        return { 
          error: 'Server-side environment',
          isAuthenticated: false,
          hasSecureData: false,
          hasLegacyData: false,
          sessionValid: false,
          userRoll: null,
          storageKeys: []
        };
      }

      const userData = this.getUserData();
      const hasSecureData = secureStorage ? secureStorage.getSecureUserData() !== null : false;
      const hasLegacyData = localStorage.getItem("user") !== null;
      
      return {
        isAuthenticated: this.isAuthenticated(),
        hasSecureData,
        hasLegacyData,
        sessionValid: this.isSessionValid(),
        userRoll: this.getUserRoll(),
        storageKeys: Object.keys(localStorage).filter(key => 
          key.includes('ss_') || key === 'user' || key.includes('session')
        )
      };
    } catch (error) {
      console.error("❌ Error getting storage info:", error);
      return { error: error.message };
    }
  }
}

export default AuthUtils;

// Export individual functions for convenience
export const {
  getUserData,
  isAuthenticated,
  getUserRoll,
  getUserName,
  isAdmin,
  logout,
  isSessionValid,
  refreshSession,
  setUserData,
  getStorageInfo
} = AuthUtils;
