import React, { useLayoutEffect, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Global Scroll Restoration Handler for Education Concept App.
 *
 * Behaviors & Safeguards:
 * 1. For EVERY NORMAL PAGE/ROUTE:
 *    When navigation opens a NEW route (pathname changes), immediately resets scroll to (0, 0)
 *    so the user sees the TOP of the newly opened page immediately without visual jump.
 * 2. Intelligent Back/Forward Navigation:
 *    For POP navigation, restores the recorded scroll position for that history entry,
 *    or defaults to (0, 0) if no prior position was recorded.
 * 3. In-page Hash Support:
 *    If a new route contains a valid `#hash`, scrolls directly to that element.
 * 4. Critical In-Page State Protection:
 *    Does NOT reset scroll when:
 *    - Search query text or category filter changes on the same route (e.g. BrowseNotesPage, CurrentAffairsPage)
 *    - A modal, drawer, dropdown, or sheet opens/closes (e.g. HamburgerDrawer, question palette)
 *    - Dynamic content finishes loading asynchronously on the same route
 *    - An active exam is taking place (guarded by `exam-mode-active` class)
 */
export const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  const prevPathnameRef = useRef<string | null>(null);
  const scrollPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Take explicit manual control over scroll restoration to prevent browser conflicts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Track scroll position per location.key for intelligent POP history restoration
  useEffect(() => {
    const handleScroll = () => {
      if (typeof document !== 'undefined' && document.body.classList.contains('exam-mode-active')) {
        return;
      }
      const x = window.scrollX || document.documentElement?.scrollLeft || document.body?.scrollLeft || 0;
      const y = window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
      scrollPositionsRef.current.set(location.key, { x, y });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // Synchronous scroll adjustment before paint
  useIsomorphicLayoutEffect(() => {
    // 1. Fullscreen Exam Mode Safeguard:
    // Never interfere with the active test-taking UI, questions, palette, or timer
    if (typeof document !== 'undefined' && document.body.classList.contains('exam-mode-active')) {
      prevPathnameRef.current = location.pathname;
      return;
    }

    const isNewRoute = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    // Only apply scroll restoration when navigating to a NEW page/route
    if (isNewRoute) {
      // Intelligent browser Back / Forward (POP) history restoration
      if (navigationType === 'POP') {
        const saved = scrollPositionsRef.current.get(location.key);
        if (saved && (saved.y > 0 || saved.x > 0)) {
          window.scrollTo({
            top: saved.y,
            left: saved.x,
            behavior: 'instant'
          });
          return;
        }
      }

      // Hash link support (e.g. /page#section)
      if (location.hash) {
        const id = location.hash.replace(/^#/, '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
          return;
        }
      }

      // Default for all new routes: immediately start at TOP (0, 0)
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
    }
  }, [location.pathname, location.key, location.hash, navigationType]);

  return null;
};
