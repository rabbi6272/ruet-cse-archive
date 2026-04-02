'use client';

import { useEffect, useState } from 'react';

/**
 * A wrapper component that prevents hydration issues by only rendering children on the client-side
 * This helps avoid SSR/Client mismatches for components that rely on browser APIs
 */
export default function NoSSR({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
