import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Lightweight, production-safe global online/offline status indicator.
 * - Detects browser connection status via navigator.onLine and online/offline events.
 * - Displays a clear "You are offline" notification when disconnected.
 * - Automatically disappears and restores normal UI when connectivity is recovered.
 * - Never reloads the page or interferes with navigation/state.
 */
export const ConnectionStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only show the brief "Back online" transition if the user was previously offline
      if (wasOffline) {
        setShowRestored(true);
        const timer = setTimeout(() => {
          setShowRestored(false);
          setWasOffline(false);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // If online and not showing the restored message, render nothing (normal UI)
  if (isOnline && !showRestored) {
    return null;
  }

  // When connection was restored briefly
  if (isOnline && showRestored) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="sticky top-0 z-50 bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md transition-all duration-300 ease-in-out"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
          <Wifi className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>
            <strong>Back online</strong> — Internet connection restored.
          </span>
        </div>
      </aside>
    );
  }

  // When disconnected / offline
  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-lg transition-all duration-300 ease-in-out"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-center">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
        <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="text-slate-100">
          <strong className="text-white font-bold">You are offline</strong> — Please check your internet connection. Some features may be unavailable.
        </span>
      </div>
    </aside>
  );
};
