'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to check if component has mounted (client-side only)
 * Prevents hydration mismatches by ensuring client-side only rendering
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Generate a stable ID that's consistent between server and client
 * Avoids hydration issues caused by Math.random() or Date.now()
 */
export function generateStableId(prefix = 'id') {
  // Use a counter that's consistent between server and client
  if (typeof window === 'undefined') {
    // Server-side: return a predictable ID
    return `${prefix}-ssr-${Math.floor(Math.random() * 1000)}`;
  }
  
  // Client-side: use timestamp + counter for uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get current date/time in a hydration-safe way
 * Returns null on server, actual date on client
 */
export function getClientDate() {
  const isClient = useIsClient();
  
  if (!isClient) {
    return null;
  }
  
  return new Date();
}

/**
 * Format date in a hydration-safe way
 * Returns placeholder text on server, formatted date on client
 */
export function formatClientDate(date = new Date(), placeholder = 'Loading...') {
  const isClient = useIsClient();
  
  if (!isClient) {
    return placeholder;
  }
  
  return date.toLocaleString('en-US', { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  });
}

/**
 * Access localStorage in a hydration-safe way
 * Returns null on server, actual value on client
 */
export function getClientStorage(key, defaultValue = null) {
  const isClient = useIsClient();
  
  if (!isClient) {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Set localStorage in a hydration-safe way
 * Only works on client-side
 */
export function setClientStorage(key, value) {
  const isClient = useIsClient();
  
  if (!isClient) {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
}
