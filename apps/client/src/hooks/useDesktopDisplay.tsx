import { useState, useEffect } from 'react';

/**
 * Custom React hook to detect if the current window matches desktop breakpoint (>= 768px).
 * Prevents inline duplicate event listener declarations.
 */
export function useDesktopDisplay(): boolean {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}
