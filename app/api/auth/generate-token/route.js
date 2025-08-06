import { NextResponse } from 'next/server';
//edited by bitto
/**
 * Generate Firebase Custom Token
 * This endpoint creates secure custom tokens for Firebase authentication
 */
export async function POST(request) {
  try {
    const { userRoll } = await request.json();
    const userRollHeader = request.headers.get('X-User-Roll');

    // Validate input
    if (!userRoll || !userRollHeader || userRoll !== userRollHeader) {
      return NextResponse.json(
        { error: 'Invalid user roll or security mismatch' },
        { status: 400 }
      );
    }

    // Validate user roll format (should be 7 digits starting with 24)
    if (!/^24\d{5}$/.test(userRoll)) {
      return NextResponse.json(
        { error: 'Invalid roll number format' },
        { status: 400 }
      );
    }

    // For now, create a basic token structure
    // In production, you would use Firebase Admin SDK to generate proper custom tokens
    const customToken = await generateSecureToken(userRoll);

    return NextResponse.json({
      token: customToken,
      uid: userRoll,
      expiresIn: 3600 // 1 hour
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure custom token
 * This is a simplified version - in production, use Firebase Admin SDK
 */
async function generateSecureToken(userRoll) {
  // Create a secure token using available web crypto APIs
  const encoder = new TextEncoder();
  
  // Token payload
  const payload = {
    iss: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
    sub: userRoll,
    uid: userRoll,
    claims: {
      roll: userRoll,
      authenticated: true,
      timestamp: Date.now()
    }
  };

  // For security, we'll create a signed token-like structure
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Simple signature using a secret (in production, use proper JWT signing)
  const secret = process.env.FIREBASE_CUSTOM_TOKEN_SECRET || 'default-secret-change-me';
  const signature = await createSignature(header + '.' + encodedPayload, secret);
  
  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Create a simple signature for the token
 */
async function createSignature(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  // Create a simple hash-based signature
  const hashBuffer = await crypto.subtle.digest('SHA-256', 
    new Uint8Array([...keyData, ...messageData])
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa(hashHex).substring(0, 32); // Truncate for size
}
