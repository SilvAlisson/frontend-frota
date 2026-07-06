import { useState, useEffect } from 'react';

/**
 * Custom hook that returns true only after the component has mounted on the client.
 * Useful for avoiding hydration mismatches when using Portals or conditional rendering based on window/browser APIs.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
