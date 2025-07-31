# 🔑 Smart Random API Key Selection System

This system automatically manages multiple Gemini API keys with **intelligent random selection**, quota monitoring, and failure handling for optimal load distribution.

## 🌟 Features

- **🎲 Random API Key Selection**: Each request uses a random available API key for even load distribution
- **Intelligent Failure Detection**: Detects quota exhaustion, rate limits, and invalid keys
- **Usage Statistics**: Tracks how often each key is used with random selection
- **Retry Logic**: Automatically retries with different random keys on failure
- **MongoDB Integration**: Stores and manages API keys in your existing database
- **Admin Dashboard**: Web interface to monitor usage patterns and manage API keys
- **Failure Recovery**: Temporary blacklisting with automatic retry after cooldown
- **Real-time Statistics**: Monitor key usage, failures, and selection patterns

## 🏗️ Architecture

```
MongoDB Database
├── API Collection
│   └── gemini_api: [array of API keys]
│
API Key Manager (lib/api-key-manager.js)
├── Smart Rotation Logic
├── Failure Detection
├── Cache Management
└── Database Integration
│
AI Chat Route (app/api/ai-chat/route.js)
├── Automatic Retry
├── Key Rotation
└── Error Handling
│
Admin Dashboard (app/admin/api-keys/page.jsx)
├── Statistics Monitor
├── Key Management
└── Emergency Controls
```

## 🚀 Setup Instructions

### 1. Database Preparation

Your MongoDB database should have this structure:

```json
{
  "_id": "...",
  "gemini_api": [
    "AIzaSyBpMnoRGcBMG_oSxz0y9NOvYfBs1LNOMU8",
    "AIzaSyDxPloRGcBMG_oSxz0y9NOvYfBs2MNQRS4",
    "AIzaSyErKnoRGcBMG_oSxz0y9NOvYfBs3OPQRT5"
    // ... more API keys
  ]
}
```

### 2. Environment Setup

Create `.env.local`:

```bash
# Admin API Key for managing API key rotation
ADMIN_API_KEY=your_secure_admin_key_here
```

### 3. Install Dependencies

```bash
npm install mongodb
```

### 4. Test the System

```bash
npm run test-api-rotation
```

## 🎯 How It Works

### Random Selection Logic

1. **Initial Load**: System loads all API keys from MongoDB
2. **Random Selection**: Each request picks a random available (non-failed) key
3. **Usage Tracking**: Monitors how often each key is selected
4. **Error Detection**: Monitors for quota/rate limit errors
5. **Automatic Failover**: Marks failed keys and excludes from random pool
6. **Recovery**: Failed keys are retried after 10-minute cooldown

### Error Handling

```javascript
// Quota Exhausted
if (error.message.includes("quota")) {
  markApiKeyAsFailed(currentKey, error);
  getRandomApiKey(); // Get new random key
  retryWithNewKey();
}

// Rate Limited
if (error.status === 429) {
  markApiKeyAsFailed(currentKey, error);
  getRandomApiKey(); // Get new random key
  retryWithNewKey();
}

// Invalid API Key
if (error.status === 401) {
  markApiKeyAsFailed(currentKey, error);
  getRandomApiKey(); // Get new random key
  retryWithNewKey();
}
```

### Cache Management

- **In-Memory Cache**: Fast access to API keys
- **Auto-Refresh**: Cache refreshes every 5 minutes
- **Failure Tracking**: Tracks failed keys with timestamps
- **Recovery Timer**: 10-minute cooldown before retry

## 🔧 Admin Dashboard

Access at: `http://localhost:3000/admin/api-keys`

### Features:

- **Real-time Statistics**: Current key usage and failure rates
- **Key Management**: Add/remove API keys
- **Emergency Controls**: Reset failed keys, refresh cache
- **Monitoring**: View rotation history and performance

### Available Actions:

- `Get Stats`: View current random selection statistics
- `Reset Failed Keys`: Clear all failure markers
- `Refresh Cache`: Reload keys from database
- `Reset Usage Stats`: Clear usage counters for fresh tracking
- `Update Keys`: Replace all API keys

## 📊 API Endpoints

### Admin API: `/api/admin/api-keys`

**GET Parameters:**

- `action=stats` - Get current statistics
- `action=reset` - Reset all failed keys
- `action=refresh` - Refresh cache from database
- `admin_key` - Authentication key

**POST Body:**

```json
{
  "admin_key": "your_admin_key",
  "action": "update_keys",
  "data": {
    "keys": ["key1", "key2", "key3"]
  }
}
```

## 🧪 Testing

### Manual Test

```bash
npm run test-api-rotation
```

### Integration Test

```javascript
// Test API rotation in your chat
const response = await fetch("/api/ai-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Hello, test the API rotation!",
  }),
});
```

## 📈 Performance Benefits

### Before (Single API Key):

- ❌ Frequent quota exhaustion
- ❌ Service interruptions
- ❌ Poor user experience
- ❌ Manual intervention required

### After (Smart Random Selection):

- ✅ 42x increased quota capacity
- ✅ Even load distribution across all keys
- ✅ Automatic failover with random selection
- ✅ Seamless user experience
- ✅ Self-healing system
- ✅ No predictable key patterns

## 🔍 Monitoring

### Key Metrics:

- **Total Keys**: Number of API keys available
- **Available Keys**: Keys currently working
- **Failed Keys**: Keys temporarily blacklisted
- **Total Requests**: Total API calls made
- **Usage Stats**: Shows which keys are selected most often
- **Selection Mode**: RANDOM (each request uses random key)
- **Success Rate**: Percentage of successful requests

### Log Messages:

```bash
🎲 Random API key selected: Index 37 (AIzaSyDq8y...) - Used 1 times
❌ Marking API key as failed: AIzaSyBpMn... - Error: quota exhausted
🔄 Getting new random API key...
✅ Successfully connected to MongoDB!
📊 API Key Status: Failed: 3/42, Available: 39
```

## 🚨 Troubleshooting

### All Keys Failed

```bash
# Emergency reset
curl "http://localhost:3000/api/admin/api-keys?action=reset&admin_key=your_key"
```

### Database Connection Issues

```bash
# Check MongoDB connection
# Verify credentials in api-key-manager.js
# Check network connectivity
```

### Cache Issues

```bash
# Refresh cache
curl "http://localhost:3000/api/admin/api-keys?action=refresh&admin_key=your_key"
```

## 🛡️ Security

- **Admin Authentication**: Secure admin key required
- **Key Obfuscation**: API keys partially hidden in logs
- **Environment Variables**: Sensitive data in environment
- **Connection Pooling**: Efficient database connections

## 🎉 Success Indicators

When working correctly, you should see:

- ✅ Smooth chat responses without interruption
- ✅ Automatic key rotation in logs
- ✅ Zero quota exhaustion errors
- ✅ Self-healing on API failures

## 📞 Support

If you encounter issues:

1. Check admin dashboard for statistics
2. Review console logs for error patterns
3. Test individual API keys manually
4. Use emergency reset if needed

---

**Your AI Assistant now has 42x the power with smart random selection for perfect load balancing! 🚀⚡🎲**
