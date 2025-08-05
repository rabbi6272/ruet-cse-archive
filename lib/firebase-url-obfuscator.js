/**
 * Firebase URL Obfuscator
 * Custom hashing system to make Firebase URLs completely unreadable
 */

class FirebaseURLObfuscator {
  constructor() {
    this.HASH_ROUNDS = 512;
    this.SALT_PRIMARY = 'ruet_cse_24_secure_firebase_salt_2024';
    this.SALT_SECONDARY = 'advanced_obfuscation_layer_key_v2';
    this.XOR_KEY = 'pikachu_secure_transform_key_2024';
  }

  /**
   * Advanced multi-layer hash function
   * @param {string} input - Input string to hash
   * @param {string} salt - Salt for hashing
   * @returns {string} - Obfuscated hash
   */
  advancedHash(input, salt) {
    let hash = 0x811c9dc5; // FNV offset basis
    const data = input + salt;
    
    // Layer 1: FNV-1a with custom modifications
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
      hash ^= (hash >>> 16); // Additional mixing
    }
    
    // Layer 2: Multiple transformation rounds
    for (let round = 0; round < this.HASH_ROUNDS; round++) {
      hash = ((hash << 7) + hash + (hash >>> 3)) >>> 0;
      hash ^= (hash >>> 11);
      hash = (hash * 0x9e3779b9) >>> 0; // Golden ratio multiplication
      hash ^= (hash >>> 15);
    }
    
    // Layer 3: Additional entropy generation
    let entropy = 0;
    for (let i = 0; i < input.length; i++) {
      entropy = (entropy * 37 + input.charCodeAt(i)) >>> 0;
      entropy ^= (entropy >>> 8);
    }
    
    // Combine and create final hash
    const finalHash = (hash ^ entropy) >>> 0;
    return finalHash.toString(36).padStart(16, '0'); // Base36 for compactness
  }

  /**
   * XOR encryption with key rotation
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted text
   */
  xorEncrypt(text, key) {
    let result = '';
    let keyIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(keyIndex % key.length);
      
      // Rotate key for additional security
      const rotatedKey = ((keyChar << 3) | (keyChar >>> 5)) & 0xFF;
      const encrypted = textChar ^ rotatedKey;
      
      result += String.fromCharCode(encrypted);
      keyIndex = (keyIndex + 1) % key.length;
    }
    
    return btoa(result); // Base64 encode
  }

  /**
   * Decrypt XOR encrypted text
   * @param {string} encryptedText - Encrypted text (base64)
   * @param {string} key - Decryption key
   * @returns {string} - Decrypted text
   */
  xorDecrypt(encryptedText, key) {
    try {
      const decoded = atob(encryptedText);
      let result = '';
      let keyIndex = 0;
      
      for (let i = 0; i < decoded.length; i++) {
        const encryptedChar = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(keyIndex % key.length);
        
        // Rotate key (same as encryption)
        const rotatedKey = ((keyChar << 3) | (keyChar >>> 5)) & 0xFF;
        const decrypted = encryptedChar ^ rotatedKey;
        
        result += String.fromCharCode(decrypted);
        keyIndex = (keyIndex + 1) % key.length;
      }
      
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Create completely obfuscated Firebase configuration
   * @param {Object} originalConfig - Original Firebase config
   * @returns {Object} - Obfuscated configuration
   */
  obfuscateFirebaseConfig(originalConfig) {
    const obfuscated = {};
    
    Object.entries(originalConfig).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        // Layer 1: Hash the key
        const hashedKey = this.advancedHash(key, this.SALT_PRIMARY);
        
        // Layer 2: Encrypt the value
        const encryptedValue = this.xorEncrypt(value, this.XOR_KEY);
        
        // Layer 3: Hash the encrypted value for additional obfuscation
        const doubleObfuscated = this.advancedHash(encryptedValue, this.SALT_SECONDARY);
        
        obfuscated[hashedKey] = {
          data: doubleObfuscated,
          encrypted: encryptedValue,
          checksum: this.advancedHash(key + value, this.SALT_PRIMARY + this.SALT_SECONDARY)
        };
      }
    });
    
    return obfuscated;
  }

  /**
   * Deobfuscate Firebase configuration
   * @param {Object} obfuscatedConfig - Obfuscated config
   * @param {Array} originalKeys - Array of original keys to restore
   * @returns {Object} - Restored Firebase config
   */
  deobfuscateFirebaseConfig(obfuscatedConfig, originalKeys) {
    const restored = {};
    
    originalKeys.forEach(key => {
      const hashedKey = this.advancedHash(key, this.SALT_PRIMARY);
      const obfuscatedData = obfuscatedConfig[hashedKey];
      
      if (obfuscatedData && obfuscatedData.encrypted) {
        const decryptedValue = this.xorDecrypt(obfuscatedData.encrypted, this.XOR_KEY);
        
        if (decryptedValue) {
          // Verify checksum for integrity
          const expectedChecksum = this.advancedHash(key + decryptedValue, this.SALT_PRIMARY + this.SALT_SECONDARY);
          
          if (obfuscatedData.checksum === expectedChecksum) {
            restored[key] = decryptedValue;
          } else {
            console.warn(`Checksum mismatch for key: ${key}`);
          }
        }
      }
    });
    
    return restored;
  }

  /**
   * Generate decoy configurations to further obfuscate the real data
   * @param {number} count - Number of decoy configs to generate
   * @returns {Array} - Array of decoy configurations
   */
  generateDecoyConfigs(count = 5) {
    const decoys = [];
    const fakeServices = [
      'analytics', 'auth-service', 'cloud-storage', 'messaging',
      'performance', 'remote-config', 'functions', 'hosting'
    ];
    
    for (let i = 0; i < count; i++) {
      const decoyConfig = {};
      
      fakeServices.forEach(service => {
        const fakeKey = this.advancedHash(`fake_${service}_${i}`, this.SALT_PRIMARY);
        const fakeValue = this.advancedHash(`decoy_${service}_data_${Date.now()}_${i}`, this.SALT_SECONDARY);
        
        decoyConfig[fakeKey] = {
          data: fakeValue,
          encrypted: this.xorEncrypt(`fake-${service}-${i}.example.com`, this.XOR_KEY),
          checksum: this.advancedHash(`fake_checksum_${i}`, this.SALT_PRIMARY)
        };
      });
      
      decoys.push(decoyConfig);
    }
    
    return decoys;
  }

  /**
   * Store obfuscated Firebase config in localStorage with decoys
   * @param {Object} firebaseConfig - Original Firebase configuration
   */
  storeObfuscatedConfig(firebaseConfig) {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
      }
      
      // Create obfuscated config
      const obfuscated = this.obfuscateFirebaseConfig(firebaseConfig);
      
      // Generate decoy configurations
      const decoys = this.generateDecoyConfigs(8);
      
      // Mix real config with decoys
      const mixedConfigs = [...decoys];
      const randomIndex = Math.floor(Math.random() * mixedConfigs.length);
      mixedConfigs.splice(randomIndex, 0, obfuscated);
      
      // Store with obfuscated keys
      mixedConfigs.forEach((config, index) => {
        const storageKey = this.advancedHash(`firebase_config_${index}`, this.SALT_PRIMARY);
        localStorage.setItem(storageKey, JSON.stringify(config));
      });
      
      // Store metadata with the real config index (also obfuscated)
      const metadataKey = this.advancedHash('firebase_metadata', this.SALT_SECONDARY);
      const metadataValue = this.xorEncrypt(JSON.stringify({
        realIndex: randomIndex,
        totalConfigs: mixedConfigs.length,
        timestamp: Date.now()
      }), this.XOR_KEY);
      
      localStorage.setItem(metadataKey, metadataValue);
      
      console.log('🔒 Firebase configuration completely obfuscated and stored');
      return true;
    } catch (error) {
      console.error('Failed to store obfuscated config:', error);
      return false;
    }
  }

  /**
   * Retrieve and deobfuscate Firebase configuration
   * @param {Array} originalKeys - Original Firebase config keys
   * @returns {Object|null} - Restored Firebase config
   */
  retrieveObfuscatedConfig(originalKeys) {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
      }
      
      // Get metadata
      const metadataKey = this.advancedHash('firebase_metadata', this.SALT_SECONDARY);
      const encryptedMetadata = localStorage.getItem(metadataKey);
      
      if (!encryptedMetadata) {
        console.warn('No obfuscated Firebase config metadata found');
        return null;
      }
      
      const metadataStr = this.xorDecrypt(encryptedMetadata, this.XOR_KEY);
      if (!metadataStr) {
        console.warn('Failed to decrypt metadata');
        return null;
      }
      
      const metadata = JSON.parse(metadataStr);
      
      // Get the real configuration
      const realConfigKey = this.advancedHash(`firebase_config_${metadata.realIndex}`, this.SALT_PRIMARY);
      const obfuscatedConfigStr = localStorage.getItem(realConfigKey);
      
      if (!obfuscatedConfigStr) {
        console.warn('Real Firebase config not found');
        return null;
      }
      
      const obfuscatedConfig = JSON.parse(obfuscatedConfigStr);
      
      // Deobfuscate the configuration
      const restoredConfig = this.deobfuscateFirebaseConfig(obfuscatedConfig, originalKeys);
      
      console.log('🔓 Firebase configuration successfully deobfuscated');
      return restoredConfig;
      
    } catch (error) {
      console.error('Failed to retrieve obfuscated config:', error);
      return null;
    }
  }

  /**
   * Clear all obfuscated Firebase data
   */
  clearObfuscatedConfig() {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      // Clear metadata first to get the count
      const metadataKey = this.advancedHash('firebase_metadata', this.SALT_SECONDARY);
      const encryptedMetadata = localStorage.getItem(metadataKey);
      
      if (encryptedMetadata) {
        const metadataStr = this.xorDecrypt(encryptedMetadata, this.XOR_KEY);
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          
          // Clear all config entries
          for (let i = 0; i < metadata.totalConfigs; i++) {
            const configKey = this.advancedHash(`firebase_config_${i}`, this.SALT_PRIMARY);
            localStorage.removeItem(configKey);
          }
        }
      }
      
      // Clear metadata
      localStorage.removeItem(metadataKey);
      
      console.log('🧹 All obfuscated Firebase configurations cleared');
    } catch (error) {
      console.error('Error clearing obfuscated config:', error);
    }
  }
}

export default FirebaseURLObfuscator;
