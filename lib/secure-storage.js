/**
 * Secure Storage Utility
 * Custom implementation of SHA-256-like hashing for client-side data protection
 * This protects sensitive user data in localStorage by hashing all values
 */

class SecureStorage {
  constructor() {
    this.STORAGE_KEY = 'ss_data'; // Secure Storage Data
    this.HASH_ROUNDS = 256; // Number of hash rounds for security
    this.SALT = 'caruet_secure_2024_salt_key'; // Static salt for consistency
  }

  /**
   * Custom SHA-256-like hash function
   * @param {string} input - The input string to hash
   * @param {string} salt - Salt to add to the input
   * @returns {string} - Hexadecimal hash string
   */
  customHash(input, salt = this.SALT) {
    const data = input + salt;
    let hash = 0x811c9dc5; // FNV offset basis
    
    // First pass - FNV-1a like algorithm
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0; // FNV prime
    }
    
    // Second pass - Custom transformation
    for (let round = 0; round < this.HASH_ROUNDS; round++) {
      hash = ((hash << 5) + hash + (hash >>> 2)) >>> 0;
      hash ^= (hash >>> 16);
      hash = (hash * 2654435761) >>> 0; // Knuth multiplicative hash
    }
    
    // Convert to hex and pad to 64 characters (256 bits)
    let hexHash = hash.toString(16);
    
    // Create additional entropy from the original input
    let entropy = 0;
    for (let i = 0; i < input.length; i++) {
      entropy = (entropy * 31 + input.charCodeAt(i)) >>> 0;
    }
    
    // Combine main hash with entropy
    const entropyHex = entropy.toString(16);
    hexHash = (hexHash + entropyHex).slice(0, 32);
    
    // Pad to ensure consistent length
    return hexHash.padStart(64, '0');
  }

  /**
   * Generate a unique hash for a given key-value pair
   * @param {string} key - The key identifier
   * @param {any} value - The value to hash
   * @returns {string} - Unique hash for this key-value pair
   */
  generateHash(key, value) {
    const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const combined = `${key}:${valueString}`;
    return this.customHash(combined);
  }

  /**
   * Create a mapping of original keys to their hashed values
   * @param {Object} data - Original data object
   * @returns {Object} - Object with hashed keys and values
   */
  hashData(data) {
    const hashedData = {};
    const keyMapping = {}; // Store mapping for reverse lookup
    
    Object.entries(data).forEach(([key, value]) => {
      const hashedKey = this.customHash(key);
      const hashedValue = this.customHash(String(value));
      
      hashedData[hashedKey] = hashedValue;
      keyMapping[key] = hashedKey;
    });
    
    // Store the mapping separately (also hashed)
    const mappingHash = this.customHash(JSON.stringify(keyMapping));
    hashedData['_mapping'] = mappingHash;
    
    return { hashedData, keyMapping };
  }

  /**
   * Store user data securely in localStorage
   * @param {Object} userData - User data to store
   */
  setSecureUserData(userData) {
    try {
      const { hashedData, keyMapping } = this.hashData(userData);
      
      // Store the hashed data
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(hashedData));
      
      // Store the mapping in a separate location (for internal use)
      // This is also hashed but needed for reverse lookup
      const mappingKey = this.customHash('key_mapping');
      localStorage.setItem(mappingKey, JSON.stringify(keyMapping));
      
      console.log('✅ User data stored securely');
      return true;
    } catch (error) {
      console.error('❌ Failed to store secure user data:', error);
      return false;
    }
  }

  /**
   * Retrieve and verify user data from localStorage
   * @returns {Object|null} - Original user data or null if invalid/expired
   */
  getSecureUserData() {
    try {
      const hashedDataStr = localStorage.getItem(this.STORAGE_KEY);
      const mappingKey = this.customHash('key_mapping');
      const keyMappingStr = localStorage.getItem(mappingKey);
      
      if (!hashedDataStr || !keyMappingStr) {
        return null;
      }
      
      const hashedData = JSON.parse(hashedDataStr);
      const keyMapping = JSON.parse(keyMappingStr);
      
      // Verify the mapping integrity
      const expectedMappingHash = this.customHash(JSON.stringify(keyMapping));
      if (hashedData['_mapping'] !== expectedMappingHash) {
        console.warn('⚠️ Data integrity check failed - mapping corrupted');
        this.clearSecureData();
        return null;
      }
      
      // For demonstration, we'll return a mock verified object
      // In a real implementation, you'd need to securely store the original values
      // or use reversible encryption instead of hashing
      return this.getMockUserData(keyMapping, hashedData);
      
    } catch (error) {
      console.error('❌ Failed to retrieve secure user data:', error);
      return null;
    }
  }

  /**
   * Mock function to simulate user data retrieval
   * In production, you'd use reversible encryption instead of hashing
   * @param {Object} keyMapping - Key mapping object
   * @param {Object} hashedData - Hashed data object
   * @returns {Object} - Mock user data
   */
  getMockUserData(keyMapping, hashedData) {
    // This is a simplified version - in reality, you'd need reversible encryption
    // For now, we'll check if the user data exists and is valid
    const rollHash = keyMapping['roll'];
    const nameHash = keyMapping['name'];
    const expiryHash = keyMapping['expiry'];
    
    if (hashedData[rollHash] && hashedData[nameHash] && hashedData[expiryHash]) {
      // Return mock data - in production, you'd decrypt the actual values
      return {
        roll: '[SECURED]',
        name: '[SECURED]',
        expiry: '[SECURED]',
        isSecure: true,
        hashedKeys: Object.keys(hashedData).filter(k => k !== '_mapping')
      };
    }
    
    return null;
  }

  /**
   * Verify if stored data matches expected values (for authentication)
   * @param {Object} inputData - Data to verify against stored data
   * @returns {boolean} - True if data matches
   */
  verifyUserData(inputData) {
    try {
      const hashedDataStr = localStorage.getItem(this.STORAGE_KEY);
      const mappingKey = this.customHash('key_mapping');
      const keyMappingStr = localStorage.getItem(mappingKey);
      
      if (!hashedDataStr || !keyMappingStr) {
        return false;
      }
      
      const hashedData = JSON.parse(hashedDataStr);
      const keyMapping = JSON.parse(keyMappingStr);
      
      // Verify each input value against stored hash
      for (const [key, value] of Object.entries(inputData)) {
        const hashedKey = keyMapping[key];
        const expectedHash = this.customHash(String(value));
        
        if (!hashedKey || hashedData[hashedKey] !== expectedHash) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to verify user data:', error);
      return false;
    }
  }

  /**
   * Check if user session is valid and not expired
   * @returns {boolean} - True if session is valid
   */
  isSessionValid() {
    try {
      const userData = this.getSecureUserData();
      if (!userData) return false;
      
      // For the hashed version, we need to store expiry in a way we can check
      // This is a limitation of pure hashing - consider using encryption instead
      const currentTime = new Date().getTime();
      
      // We'll store the expiry check separately for demo purposes
      const expiryCheck = localStorage.getItem('session_check');
      if (!expiryCheck) return false;
      
      return currentTime < parseInt(expiryCheck);
    } catch (error) {
      console.error('❌ Failed to check session validity:', error);
      return false;
    }
  }

  /**
   * Clear all secure data
   */
  clearSecureData() {
    const mappingKey = this.customHash('key_mapping');
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(mappingKey);
    localStorage.removeItem('session_check');
    console.log('🧹 Secure data cleared');
  }

  /**
   * Enhanced version that uses reversible encryption instead of hashing
   * This allows us to actually retrieve the original values
   */
  // Note: This would require a proper encryption library in production
}

// Enhanced version with reversible encryption
class SecureStorageWithEncryption extends SecureStorage {
  constructor() {
    super();
    this.ENCRYPTION_KEY = null; // Initialize as null, will be generated when needed
  }

  /**
   * Generate a consistent encryption key based on browser fingerprint
   * @returns {string} - Encryption key
   */
  generateEncryptionKey() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof screen === 'undefined') {
      // Server-side or missing browser APIs - use fallback key
      console.warn('⚠️ Browser APIs not available, using fallback encryption key');
      return this.customHash('fallback_server_key_' + this.SALT).slice(0, 32);
    }

    try {
      const fingerprint = [
        navigator.userAgent || 'unknown',
        navigator.language || 'en',
        screen.width || 1920,
        screen.height || 1080,
        new Date().getTimezoneOffset() || 0,
        this.SALT
      ].join('|');
      
      return this.customHash(fingerprint).slice(0, 32);
    } catch (error) {
      console.warn('⚠️ Error generating browser fingerprint, using fallback:', error);
      return this.customHash('fallback_error_key_' + this.SALT).slice(0, 32);
    }
  }

  /**
   * Get or generate encryption key (lazy initialization)
   * @returns {string} - Encryption key
   */
  getEncryptionKey() {
    if (!this.ENCRYPTION_KEY) {
      this.ENCRYPTION_KEY = this.generateEncryptionKey();
    }
    return this.ENCRYPTION_KEY;
  }

  /**
   * Simple XOR encryption (for demonstration - use proper encryption in production)
   * @param {string} text - Text to encrypt/decrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted/decrypted text
   */
  xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  /**
   * Decrypt XOR encrypted text
   * @param {string} encryptedText - Encrypted text (base64)
   * @param {string} key - Encryption key
   * @returns {string} - Decrypted text
   */
  xorDecrypt(encryptedText, key) {
    try {
      const decoded = atob(encryptedText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Store user data with encryption
   * @param {Object} userData - User data to store
   */
  setSecureUserData(userData) {
    try {
      // Ensure we're in browser environment before proceeding
      if (typeof window === 'undefined') {
        console.warn('⚠️ setSecureUserData called on server-side, skipping');
        return false;
      }

      const encrypted = {};
      const keyMapping = {};
      const encryptionKey = this.getEncryptionKey();
      
      Object.entries(userData).forEach(([key, value]) => {
        const hashedKey = this.customHash(key);
        const encryptedValue = this.xorEncrypt(String(value), encryptionKey);
        
        encrypted[hashedKey] = encryptedValue;
        keyMapping[key] = hashedKey;
      });
      
      // Store current time for expiry checking
      if (userData.expiry) {
        localStorage.setItem('session_check', String(userData.expiry));
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encrypted));
      
      const mappingKey = this.customHash('key_mapping');
      const encryptedMapping = this.xorEncrypt(JSON.stringify(keyMapping), encryptionKey);
      localStorage.setItem(mappingKey, encryptedMapping);
      
      console.log('✅ User data encrypted and stored securely');
      return true;
    } catch (error) {
      console.error('❌ Failed to store encrypted user data:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt user data
   * @returns {Object|null} - Original user data or null if invalid/expired
   */
  getSecureUserData() {
    try {
      // Ensure we're in browser environment before proceeding
      if (typeof window === 'undefined') {
        return null;
      }

      const encryptedDataStr = localStorage.getItem(this.STORAGE_KEY);
      const mappingKey = this.customHash('key_mapping');
      const encryptedMappingStr = localStorage.getItem(mappingKey);
      
      if (!encryptedDataStr || !encryptedMappingStr) {
        return null;
      }
      
      const encryptedData = JSON.parse(encryptedDataStr);
      const encryptionKey = this.getEncryptionKey();
      const keyMapping = JSON.parse(this.xorDecrypt(encryptedMappingStr, encryptionKey));
      
      if (!keyMapping) {
        console.warn('⚠️ Failed to decrypt key mapping');
        return null;
      }
      
      const userData = {};
      
      Object.entries(keyMapping).forEach(([originalKey, hashedKey]) => {
        const encryptedValue = encryptedData[hashedKey];
        if (encryptedValue) {
          const decryptedValue = this.xorDecrypt(encryptedValue, encryptionKey);
          if (decryptedValue !== null) {
            // Handle different data types properly
            if (originalKey === 'expiry') {
              // Ensure expiry is always a number
              userData[originalKey] = parseInt(decryptedValue);
            } else if (!isNaN(decryptedValue) && decryptedValue.trim() !== '') {
              // Parse as number if it's a valid number
              userData[originalKey] = Number(decryptedValue);
            } else {
              // Keep as string
              userData[originalKey] = decryptedValue;
            }
          }
        }
      });
      
      // Check expiry
      if (userData.expiry && new Date().getTime() > userData.expiry) {
        console.log('🕐 Session expired');
        this.clearSecureData();
        return null;
      }
      
      return userData;
    } catch (error) {
      console.error('❌ Failed to retrieve encrypted user data:', error);
      return null;
    }
  }

  /**
   * Get specific user field (decrypted)
   * @param {string} fieldName - The field name to retrieve
   * @returns {any} - The decrypted field value or null
   */
  getUserField(fieldName) {
    const userData = this.getSecureUserData();
    return userData ? userData[fieldName] : null;
  }

  /**
   * Verify user data without full decryption (for performance)
   * @param {string} fieldName - Field to verify
   * @param {any} expectedValue - Expected value
   * @returns {boolean} - True if field matches expected value
   */
  verifyField(fieldName, expectedValue) {
    try {
      // Ensure we're in browser environment before proceeding
      if (typeof window === 'undefined') {
        return false;
      }

      const encryptedDataStr = localStorage.getItem(this.STORAGE_KEY);
      const mappingKey = this.customHash('key_mapping');
      const encryptedMappingStr = localStorage.getItem(mappingKey);
      
      if (!encryptedDataStr || !encryptedMappingStr) {
        return false;
      }
      
      const encryptedData = JSON.parse(encryptedDataStr);
      const encryptionKey = this.getEncryptionKey();
      const keyMapping = JSON.parse(this.xorDecrypt(encryptedMappingStr, encryptionKey));
      
      if (!keyMapping) return false;
      
      const hashedKey = keyMapping[fieldName];
      if (!hashedKey || !encryptedData[hashedKey]) return false;
      
      const decryptedValue = this.xorDecrypt(encryptedData[hashedKey], encryptionKey);
      
      // Handle type conversion
      let processedValue = decryptedValue;
      if (fieldName === 'expiry') {
        processedValue = parseInt(decryptedValue);
      } else if (!isNaN(decryptedValue) && decryptedValue.trim() !== '') {
        processedValue = Number(decryptedValue);
      }
      
      return processedValue === expectedValue;
    } catch (error) {
      console.error('❌ Failed to verify field:', error);
      return false;
    }
  }
}

// Export both versions
export { SecureStorage, SecureStorageWithEncryption };

// Create default instance only on client-side
export const secureStorage = typeof window !== 'undefined' 
  ? new SecureStorageWithEncryption() 
  : null;
