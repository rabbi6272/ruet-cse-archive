"use client";

import { useEffect } from 'react';

/**
 * Firebase URL Obfuscation Initializer Component
 * Initializes the Firebase URL obfuscation system on the client side
 */
export default function FirebaseObfuscationInit() {
  useEffect(() => {
    let cleaner = null;
    
    const initializeObfuscation = async () => {
      try {
        // Dynamic import to ensure client-side only
        const { default: firebaseCleaner } = await import('@/lib/firebase-storage-cleaner');
        cleaner = firebaseCleaner;
        
        console.log('🚀 Firebase URL obfuscation initialized');
      } catch (error) {
        console.error('Failed to initialize Firebase URL obfuscation:', error);
      }
    };
    
    // Initialize immediately
    initializeObfuscation();
    
    // Additional cleanup on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && cleaner) {
        setTimeout(() => {
          cleaner.cleanExistingFirebaseData();
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return null; // This component doesn't render anything
}
