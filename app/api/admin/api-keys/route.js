import { 
  getApiKeyStats, 
  resetFailedKeys, 
  updateApiKeysInDB,
  refreshApiKeyCache,
  getCurrentApiKey,
  resetUsageStats
} from '@/lib/api-key-manager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const adminKey = searchParams.get('admin_key');
    
    // Simple admin authentication - you can enhance this
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'admin123'; // Set this in your environment
    
    if (adminKey !== ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'stats':
        const stats = getApiKeyStats();
        const currentKey = await getCurrentApiKey();
        
        return Response.json({
          success: true,
          data: {
            ...stats,
            currentKey: currentKey.key.substring(0, 15) + '...',
            timestamp: new Date().toISOString()
          }
        });

      case 'reset':
        await resetFailedKeys();
        const newStats = getApiKeyStats();
        
        return Response.json({
          success: true,
          message: 'All failed keys have been reset',
          data: newStats
        });

      case 'refresh':
        await refreshApiKeyCache();
        const refreshedStats = getApiKeyStats();
        
        return Response.json({
          success: true,
          message: 'API key cache refreshed from database',
          data: refreshedStats
        });

      case 'reset_usage':
        const resetUsageStats = await resetUsageStats();
        
        return Response.json({
          success: true,
          message: 'Usage statistics have been reset',
          data: resetUsageStats
        });

      default:
        return Response.json({
          success: true,
          message: 'API Key Manager Admin Panel',
          availableActions: [
            'stats - Get current API key statistics',
            'reset - Reset all failed keys',
            'refresh - Refresh cache from database',
            'reset_usage - Reset usage statistics'
          ]
        });
    }

  } catch (error) {
    console.error('Admin API Error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { admin_key, action, data } = await request.json();
    
    // Simple admin authentication
    const ADMIN_KEY = process.env.ADMIN_API_KEY || 'admin123';
    
    if (admin_key !== ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'update_keys':
        if (!data || !Array.isArray(data.keys)) {
          return Response.json({ 
            error: 'Invalid data. Expected { keys: [...] }' 
          }, { status: 400 });
        }
        
        const result = await updateApiKeysInDB(data.keys);
        const updatedStats = getApiKeyStats();
        
        return Response.json({
          success: true,
          message: `Updated ${data.keys.length} API keys in database`,
          data: {
            updateResult: result,
            stats: updatedStats
          }
        });

      case 'test_current_key':
        try {
          const keyInfo = await getCurrentApiKey();
          
          // Simple test - just try to get the key
          return Response.json({
            success: true,
            message: 'Current API key is accessible',
            data: {
              keyIndex: keyInfo.index,
              keyPreview: keyInfo.key.substring(0, 15) + '...',
              totalKeys: keyInfo.totalKeys,
              failedKeys: keyInfo.failedKeys
            }
          });
        } catch (testError) {
          return Response.json({
            success: false,
            message: 'Current API key test failed',
            error: testError.message
          });
        }

      default:
        return Response.json({
          error: 'Invalid action',
          availableActions: [
            'update_keys - Update API keys in database',
            'test_current_key - Test current API key'
          ]
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin API POST Error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
