import { useEffect, useState } from 'react';

/**
 * Custom hook to lock body scroll when a modal or drawer is open.
 * It handles both desktop (overflow: hidden + padding) and mobile (restoring scroll position).
 */
export function useScrollLock(isOpen: boolean, isDesktop: boolean) {
  const [savedScrollY, setSavedScrollY] = useState(0);

  // Desktop scroll lock
  useEffect(() => {
    if (isOpen && isDesktop) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, isDesktop]);

  // Mobile scroll save
  useEffect(() => {
    if (isOpen && !isDesktop) {
      setSavedScrollY(window.scrollY);
    }
  }, [isOpen, isDesktop]);

  // Mobile scroll restore on close
  useEffect(() => {
    if (!isOpen && !isDesktop) {
      const timeoutId = setTimeout(() => {
        window.scrollTo({ top: savedScrollY });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isDesktop, savedScrollY]);
}
