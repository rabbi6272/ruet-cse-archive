// Test script for API key rotation system
// Run this with: node test-api-rotation.js

import { 
  getCurrentApiKey, 
  markApiKeyAsFailed, 
  rotateToNextApiKey,
  getApiKeyStats,
  resetFailedKeys
} from './lib/api-key-manager.js';

async function testApiKeyRotation() {
  console.log('🧪 Testing API Key Rotation System\n');
  
  try {
    // Test 1: Get current API key
    console.log('1️⃣ Testing getCurrentApiKey()...');
    const currentKey = await getCurrentApiKey();
    console.log(`✅ Current API key: ${currentKey.key.substring(0, 15)}... (Index: ${currentKey.index})`);
    console.log(`📊 Total keys: ${currentKey.totalKeys}, Failed: ${currentKey.failedKeys}\n`);
    
    // Test 2: Get statistics
    console.log('2️⃣ Testing getApiKeyStats()...');
    const stats = getApiKeyStats();
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));
    console.log();
    
    // Test 3: Mark key as failed
    console.log('3️⃣ Testing markApiKeyAsFailed()...');
    await markApiKeyAsFailed(currentKey.key, new Error('Test quota exhausted'));
    const statsAfterFail = getApiKeyStats();
    console.log(`✅ Failed keys after marking: ${statsAfterFail.failedKeys}/${statsAfterFail.totalKeys}\n`);
    
    // Test 4: Rotate to next key
    console.log('4️⃣ Testing rotateToNextApiKey()...');
    const nextKey = await rotateToNextApiKey();
    console.log(`✅ Next API key: ${nextKey.key.substring(0, 15)}... (Index: ${nextKey.index})\n`);
    
    // Test 5: Reset failed keys
    console.log('5️⃣ Testing resetFailedKeys()...');
    await resetFailedKeys();
    const statsAfterReset = getApiKeyStats();
    console.log(`✅ Failed keys after reset: ${statsAfterReset.failedKeys}/${statsAfterReset.totalKeys}\n`);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testApiKeyRotation();
