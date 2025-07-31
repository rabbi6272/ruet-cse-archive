import { MongoClient, ServerApiVersion } from 'mongodb';


const MONGO_URL = `mongodb+srv://shadow_mist0:shadow_mist@cluster0.zozzwwv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let cachedClient = null;
let cachedDb = null;

let apiKeyCache = {
  keys: [],
  currentIndex: 0, 
  lastFetch: 0,
  failedKeys: new Set(),
  retryTimestamp: {},
  usageCount: {} 
};


async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGO_URL, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    
    const db = client.db("phantom_bot");
    
    cachedClient = client;
    cachedDb = db;
    
    console.log("✅ Successfully connected to MongoDB!");
    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Load API keys from MongoDB
 */
async function loadApiKeysFromDB() {
  try {
    const { db } = await connectToDatabase();
    const apiDoc = await db.collection("API").findOne({});
    
    if (!apiDoc || !apiDoc.gemini_api || !Array.isArray(apiDoc.gemini_api)) {
      throw new Error("No Gemini API keys found in database");
    }
    
    const keys = apiDoc.gemini_api.filter(key => key && key.trim().length > 0);
    
    if (keys.length === 0) {
      throw new Error("No valid API keys found");
    }
    
    console.log(`🔑 Loaded ${keys.length} API keys from database`);
    return keys;
  } catch (error) {
    console.error("❌ Error loading API keys:", error);
    throw error;
  }
}

/**
 * Initialize or refresh API key cache
 */
async function refreshApiKeyCache() {
  try {
    const keys = await loadApiKeysFromDB();
    
    // Reset failed keys that haven't been tried for 10 minutes
    const now = Date.now();
    const retryAfter = 10 * 60 * 1000; // 10 minutes
    
    apiKeyCache.failedKeys.forEach(failedKey => {
      const failTime = apiKeyCache.retryTimestamp[failedKey];
      if (failTime && (now - failTime) > retryAfter) {
        apiKeyCache.failedKeys.delete(failedKey);
        delete apiKeyCache.retryTimestamp[failedKey];
        console.log(`🔄 Retry allowed for previously failed key: ${failedKey.substring(0, 10)}...`);
      }
    });
    
    apiKeyCache.keys = keys;
    apiKeyCache.lastFetch = now;
    
    // Initialize usage count for new keys
    keys.forEach(key => {
      if (!apiKeyCache.usageCount[key]) {
        apiKeyCache.usageCount[key] = 0;
      }
    });
    
    // Find a working key to start with (for compatibility)
    let workingIndex = 0;
    for (let i = 0; i < keys.length; i++) {
      if (!apiKeyCache.failedKeys.has(keys[i])) {
        workingIndex = i;
        break;
      }
    }
    
    apiKeyCache.currentIndex = workingIndex;
    console.log(`🎯 API key cache refreshed. ${keys.length} keys available for random selection`);
    
    return keys;
  } catch (error) {
    console.error("❌ Failed to refresh API key cache:", error);
    throw error;
  }
}

/**
 * Get a random API key from available keys
 */
function getRandomApiKey() {
  // Get all available (non-failed) keys
  const availableKeys = apiKeyCache.keys.filter(key => !apiKeyCache.failedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("No available API keys for random selection");
  }
  
  // Select random key from available keys
  const randomIndex = Math.floor(Math.random() * availableKeys.length);
  const selectedKey = availableKeys[randomIndex];
  
  // Find the actual index in the full keys array for tracking
  const actualIndex = apiKeyCache.keys.indexOf(selectedKey);
  
  // Update usage count
  if (!apiKeyCache.usageCount[selectedKey]) {
    apiKeyCache.usageCount[selectedKey] = 0;
  }
  apiKeyCache.usageCount[selectedKey]++;
  
  console.log(`🎲 Random API key selected: Index ${actualIndex} (${selectedKey.substring(0, 10)}...) - Used ${apiKeyCache.usageCount[selectedKey]} times`);
  
  return {
    key: selectedKey,
    index: actualIndex,
    totalKeys: apiKeyCache.keys.length,
    failedKeys: apiKeyCache.failedKeys.size,
    availableKeys: availableKeys.length,
    usageCount: apiKeyCache.usageCount[selectedKey]
  };
}

/**
 * Get current API key with smart random selection
 */
async function getCurrentApiKey() {
  const now = Date.now();
  const cacheAge = now - apiKeyCache.lastFetch;
  const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  
  // Refresh cache if it's too old or empty
  if (cacheAge > cacheMaxAge || apiKeyCache.keys.length === 0) {
    console.log("🔄 Refreshing API key cache (cache age:", Math.floor(cacheAge / 1000), "seconds)");
    await refreshApiKeyCache();
  }
  
  // Check if all keys are failed
  const availableKeys = apiKeyCache.keys.filter(key => !apiKeyCache.failedKeys.has(key));
  
  if (availableKeys.length === 0) {
    console.warn("⚠️ All API keys are marked as failed. Refreshing cache...");
    await refreshApiKeyCache();
    
    // If still no keys available, throw error
    if (apiKeyCache.keys.length === 0) {
      throw new Error("No API keys available");
    }
  }
  
  // Use random selection instead of sequential rotation
  try {
    return getRandomApiKey();
  } catch (error) {
    console.error("❌ Random key selection failed:", error.message);
    throw new Error("No working API keys available for random selection");
  }
}

/**
 * Mark an API key as failed
 */
async function markApiKeyAsFailed(apiKey, error) {
  console.log(`❌ Marking API key as failed: ${apiKey.substring(0, 10)}... - Error: ${error.message}`);
  
  apiKeyCache.failedKeys.add(apiKey);
  apiKeyCache.retryTimestamp[apiKey] = Date.now();
  
  // Don't change currentIndex for random selection, just log status
  console.log(`📊 API Key Status: Failed: ${apiKeyCache.failedKeys.size}/${apiKeyCache.keys.length}, Available: ${apiKeyCache.keys.length - apiKeyCache.failedKeys.size}`);
}

/**
 * Get next API key (get another random key)
 */
async function rotateToNextApiKey() {
  if (apiKeyCache.keys.length === 0) {
    await refreshApiKeyCache();
  }
  
  console.log(`🎲 Getting new random API key...`);
  
  return getCurrentApiKey();
}

/**
 * Get API key rotation statistics
 */
function getApiKeyStats() {
  // Calculate usage statistics
  const usageStats = Object.keys(apiKeyCache.usageCount).map(key => ({
    keyPreview: key.substring(0, 10) + '...',
    usageCount: apiKeyCache.usageCount[key],
    isFailed: apiKeyCache.failedKeys.has(key)
  }));
  
  // Sort by usage count
  usageStats.sort((a, b) => b.usageCount - a.usageCount);
  
  return {
    totalKeys: apiKeyCache.keys.length,
    currentIndex: apiKeyCache.currentIndex, // For compatibility, but not used in random mode
    failedKeys: apiKeyCache.failedKeys.size,
    availableKeys: apiKeyCache.keys.length - apiKeyCache.failedKeys.size,
    lastFetch: apiKeyCache.lastFetch,
    failedKeysList: Array.from(apiKeyCache.failedKeys).map(key => key.substring(0, 10) + '...'),
    cacheAge: Date.now() - apiKeyCache.lastFetch,
    selectionMode: 'RANDOM',
    usageStats: usageStats.slice(0, 10), // Top 10 most used keys
    totalRequests: Object.values(apiKeyCache.usageCount).reduce((sum, count) => sum + count, 0)
  };
}

/**
 * Reset all failed keys (emergency reset)
 */
async function resetFailedKeys() {
  apiKeyCache.failedKeys.clear();
  apiKeyCache.retryTimestamp = {};
  // Keep usage count for statistics
  console.log("🔄 All failed keys have been reset");
  
  return getCurrentApiKey();
}

/**
 * Update API keys in database (admin function)
 */
async function updateApiKeysInDB(newKeys) {
  try {
    const { db } = await connectToDatabase();
    
    const result = await db.collection("API").updateOne(
      {},
      { $set: { gemini_api: newKeys } },
      { upsert: true }
    );
    
    console.log(`✅ Updated API keys in database. Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);
    
    // Refresh cache with new keys
    await refreshApiKeyCache();
    
    return result;
  } catch (error) {
    console.error("❌ Error updating API keys:", error);
    throw error;
  }
}

/**
 * Reset usage statistics (admin function)
 */
async function resetUsageStats() {
  apiKeyCache.usageCount = {};
  console.log("📊 Usage statistics have been reset");
  return getApiKeyStats();
}

export {
  getCurrentApiKey,
  markApiKeyAsFailed,
  rotateToNextApiKey,
  getApiKeyStats,
  resetFailedKeys,
  updateApiKeysInDB,
  refreshApiKeyCache,
  resetUsageStats
};
