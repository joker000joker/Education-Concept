import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface NavIconProps {
  isActive?: boolean;
}

// -----------------------------------------------------------------------------
// 1. HOME ICON: Modern dimensional house with blue/cyan gradient
// -----------------------------------------------------------------------------
const HomeNavIcon: React.FC<NavIconProps> = ({ isActive }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-[22px] h-[22px] transition-transform duration-200 shrink-0 ${
      isActive ? 'scale-105 drop-shadow-[0_2px_4px_rgba(37,99,235,0.25)]' : 'opacity-90 group-hover:opacity-100'
    }`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ecNavHomeGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="0.45" stopColor="#2563EB" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="ecNavHomeRoof" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="ecNavHomeDoor" x1="10" y1="13.5" x2="14" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BAE6FD" />
        <stop offset="1" stopColor="#7DD3FC" />
      </linearGradient>
    </defs>
    {/* Base House Body */}
    <path
      d="M4.5 10.5V19C4.5 20.1046 5.39543 21 6.5 21H17.5C18.6046 21 19.5 20.1046 19.5 19V10.5L12 4L4.5 10.5Z"
      fill="url(#ecNavHomeGrad)"
    />
    {/* Roof Overhang with Depth */}
    <path
      d="M2.35 11.25L11.35 3.35C11.72 3.02 12.28 3.02 12.65 3.35L21.65 11.25C22.05 11.6 22.1 12.2 21.75 12.6C21.4 13 20.8 13.05 20.4 12.7L12 5.35L3.6 12.7C3.2 13.05 2.6 13 2.25 12.6C1.9 12.2 1.95 11.6 2.35 11.25Z"
      fill="url(#ecNavHomeRoof)"
    />
    {/* Door / Entry Glow */}
    <path
      d="M9.5 21V15C9.5 14.17 10.17 13.5 11 13.5H13C13.83 13.5 14.5 14.17 14.5 15V21H9.5Z"
      fill="url(#ecNavHomeDoor)"
    />
    {/* Circular Attic Window Accent */}
    <circle cx="12" cy="8.75" r="1.35" fill="#F0F9FF" opacity="0.95" />
  </svg>
);

// -----------------------------------------------------------------------------
// 2. MY NOTES ICON: Premium notebook with blue/purple gradient & bookmark
// -----------------------------------------------------------------------------
const NotesNavIcon: React.FC<NavIconProps> = ({ isActive }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-[22px] h-[22px] transition-transform duration-200 shrink-0 ${
      isActive ? 'scale-105 drop-shadow-[0_2px_4px_rgba(99,102,241,0.25)]' : 'opacity-90 group-hover:opacity-100'
    }`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ecNavNotesCover" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="0.55" stopColor="#6366F1" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="ecNavNotesRibbon" x1="10" y1="3.5" x2="13" y2="10.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    {/* Left Page Body */}
    <path
      d="M3 5.5C3 4.4 3.9 3.5 5 3.5H11.5V19.5H5C3.9 19.5 3 18.6 3 17.5V5.5Z"
      fill="url(#ecNavNotesCover)"
    />
    {/* Right Page Body */}
    <path
      d="M12.5 3.5H19C20.1 3.5 21 4.4 21 5.5V17.5C21 18.6 20.1 19.5 19 19.5H12.5V3.5Z"
      fill="url(#ecNavNotesCover)"
      opacity="0.92"
    />
    {/* Inner Pages Sheets Accent */}
    <path
      d="M5 5H10.5V18H5C4.45 18 4 17.55 4 17V6C4 5.45 4.45 5 5 5Z"
      fill="#EFF6FF"
      opacity="0.95"
    />
    <path
      d="M13.5 5H19C19.55 5 20 5.45 20 6V17C20 17.55 19.55 18 19 18H13.5V5Z"
      fill="#F8FAFC"
      opacity="0.95"
    />
    {/* Note Lines */}
    <line x1="5.5" y1="8" x2="9" y2="8" stroke="#93C5FD" strokeWidth="1" strokeLinecap="round" />
    <line x1="5.5" y1="11" x2="9" y2="11" stroke="#93C5FD" strokeWidth="1" strokeLinecap="round" />
    <line x1="5.5" y1="14" x2="8" y2="14" stroke="#93C5FD" strokeWidth="1" strokeLinecap="round" />
    <line x1="15" y1="8" x2="18.5" y2="8" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" />
    <line x1="15" y1="11" x2="18.5" y2="11" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" />
    <line x1="15" y1="14" x2="17.5" y2="14" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" />
    {/* Bookmark Ribbon Hanging Down */}
    <path
      d="M11 3.5V11L12 9.75L13 11V3.5H11Z"
      fill="url(#ecNavNotesRibbon)"
    />
  </svg>
);

// -----------------------------------------------------------------------------
// 3. MY TESTS ICON: Premium clipboard checklist with blue/purple & checkmarks
// -----------------------------------------------------------------------------
const TestsNavIcon: React.FC<NavIconProps> = ({ isActive }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-[22px] h-[22px] transition-transform duration-200 shrink-0 ${
      isActive ? 'scale-105 drop-shadow-[0_2px_4px_rgba(79,70,229,0.25)]' : 'opacity-90 group-hover:opacity-100'
    }`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ecNavTestBoard" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB" />
        <stop offset="0.65" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="ecNavTestPaper" x1="5.5" y1="6" x2="18.5" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#F1F5F9" />
      </linearGradient>
    </defs>
    {/* Clipboard Base with Smooth Corners */}
    <rect x="4" y="3.5" width="16" height="18" rx="2.5" fill="url(#ecNavTestBoard)" />
    {/* Paper Sheet */}
    <rect x="5.5" y="6" width="13" height="14" rx="1.5" fill="url(#ecNavTestPaper)" />
    {/* Top Clip Holder */}
    <path
      d="M9 3H15C15.55 3 16 3.45 16 4V5H8V4C8 3.45 8.45 3 9 3Z"
      fill="#1E293B"
      opacity="0.85"
    />
    <rect x="10" y="2" width="4" height="2" rx="1" fill="#38BDF8" />
    {/* Checklist Question Stamped Items */}
    <circle cx="8" cy="9.5" r="1.3" fill="#10B981" />
    <path d="M7.4 9.5L7.8 9.9L8.7 9" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10.8" y="8.8" width="6.2" height="1.4" rx="0.7" fill="#94A3B8" />

    <circle cx="8" cy="13" r="1.3" fill="#10B981" />
    <path d="M7.4 13L7.8 13.4L8.7 12.5" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10.8" y="12.3" width="5.2" height="1.4" rx="0.7" fill="#94A3B8" />

    <circle cx="8" cy="16.5" r="1.3" fill="#818CF8" />
    <path d="M7.4 16.5L7.8 16.9L8.7 16" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10.8" y="15.8" width="4.5" height="1.4" rx="0.7" fill="#94A3B8" />
  </svg>
);

// -----------------------------------------------------------------------------
// 4. WHATSAPP ICON: Uploaded WhatsApp logo asset (/whatsapp-logo.png)
// -----------------------------------------------------------------------------
const WhatsAppNavIcon: React.FC<NavIconProps> = ({ isActive }) => (
  <img
    src="/whatsapp-logo.png"
    alt="WhatsApp"
    className={`w-[22px] h-[22px] object-contain transition-transform duration-200 shrink-0 select-none ${
      isActive ? 'scale-105 drop-shadow-[0_2px_4px_rgba(37,211,102,0.3)]' : 'opacity-90 group-hover:opacity-100'
    }`}
    draggable={false}
  />
);

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const search = location.search;

  // Safeguard: Never render mobile website bottom navigation while exam mode is active
  if (typeof document !== 'undefined' && document.body.classList.contains('exam-mode-active')) {
    return null;
  }

  // WhatsApp Channel URL state with local cache fallback
  const [whatsappUrl, setWhatsappUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('ec_whatsapp_channel_url') || 'https://whatsapp.com/channel';
    } catch {
      return 'https://whatsapp.com/channel';
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadWhatsAppUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['whatsapp_channel_url', 'whatsapp_number']);

        if (!error && data && data.length > 0) {
          const channelRow = data.find((r) => r.key === 'whatsapp_channel_url');
          const legacyRow = data.find((r) => r.key === 'whatsapp_number');
          const targetUrl = channelRow?.value || (legacyRow?.value?.includes('channel') ? legacyRow.value : null);
          if (targetUrl && isMounted) {
            setWhatsappUrl(targetUrl);
            try {
              localStorage.setItem('ec_whatsapp_channel_url', targetUrl);
            } catch {}
          }
        }
      } catch {
        // Fall back gracefully to cached or default value
      }
    };

    loadWhatsAppUrl();

    // Listen for storage events (e.g. when updated in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ec_whatsapp_channel_url' && e.newValue) {
        setWhatsappUrl(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    {
      label: 'Home',
      icon: HomeNavIcon,
      href: '/',
      isActive: path === '/',
    },
    {
      label: 'My Notes',
      icon: NotesNavIcon,
      href: '/profile?tab=notes',
      isActive: path.includes('profile') && search.includes('tab=notes'),
    },
    {
      label: 'My Tests',
      icon: TestsNavIcon,
      href: '/profile?tab=tests',
      isActive: path.includes('profile') && search.includes('tab=tests'),
    },
    {
      label: 'WhatsApp',
      icon: WhatsAppNavIcon,
      href: whatsappUrl,
      isActive: false,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 h-[64px] sm:h-[68px] px-1">
        {navItems.map((item) => {
          const isExternal = item.href.startsWith('http');
          const Wrapper = isExternal ? 'a' : Link;
          const wrapperProps = isExternal 
            ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' } 
            : { to: item.href };

          return (
            <Wrapper
              key={item.label}
              {...wrapperProps}
              className="group flex flex-col items-center justify-center w-full h-full outline-hidden touch-manipulation select-none"
            >
              <div 
                className={`relative flex items-center justify-center w-[54px] h-[32px] mb-0.5 rounded-full transition-all duration-200 ease-out ${
                  item.isActive 
                    ? 'bg-blue-50/90 text-blue-600 ring-1 ring-blue-500/15 shadow-2xs' 
                    : 'bg-transparent text-slate-400 group-hover:bg-slate-50/60'
                }`}
              >
                <item.icon isActive={item.isActive} />
              </div>
              <span 
                className={`text-[10px] tracking-tight transition-colors duration-200 leading-tight ${
                  item.isActive 
                    ? 'text-blue-700 font-bold' 
                    : 'text-slate-500 font-medium group-hover:text-slate-700'
                }`}
              >
                {item.label}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
};
