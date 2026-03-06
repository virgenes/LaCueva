import { useState, useEffect } from 'react';

/**
 * Detects if we're on a REAL mobile/tablet device in landscape orientation.
 * Uses User-Agent + touch capability — NOT screen width, because landscape
 * phones can have >1024px width and get misdetected as desktop.
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  // Check touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // Check User-Agent for mobile/tablet keywords
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  // iPadOS 13+ reports as desktop Safari but has touch
  const isIPad = hasTouch && /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return hasTouch && (mobileUA || isIPad);
}

export function useLandscapeMobile() {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    const isMobile = isTouchDevice();

    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isLandscape = w > h;
      setIsLandscapeMobile(isMobile && isLandscape);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 200));
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isLandscapeMobile;
}

/** Exported helper: is this a touch/mobile device regardless of orientation */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => { setIsTouch(isTouchDevice()); }, []);
  return isTouch;
}
