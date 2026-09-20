import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, FileText } from 'lucide-react';

const WhatsAppIcon = ({ className, strokeWidth = 2 }: { className?: string, strokeWidth?: number | string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M16 13.46v1.5a1 1 0 0 1-1.09 1 9.9 9.9 0 0 1-4.31-1.53 9.75 9.75 0 0 1-3-3 9.9 9.9 0 0 1-1.53-4.33A1 1 0 0 1 7.05 6h1.5a1 1 0 0 1 1 .86 6.42 6.42 0 0 0 .35 1.4 1 1 0 0 1-.22 1.06L9 9.95a8 8 0 0 0 3 3l.63-.63a1 1 0 0 1 1.06-.22 6.42 6.42 0 0 0 1.4.35 1 1 0 0 1 1 .86z" />
  </svg>
);

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const search = location.search;

  // Safeguard: Never render mobile website bottom navigation while exam mode is active
  if (typeof document !== 'undefined' && document.body.classList.contains('exam-mode-active')) {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
      isActive: path === '/',
    },
    {
      label: 'My Notes',
      icon: BookOpen,
      href: '/profile?tab=notes',
      isActive: path.includes('profile') && search.includes('tab=notes'),
    },
    {
      label: 'My Tests',
      icon: FileText,
      href: '/profile?tab=tests',
      isActive: path.includes('profile') && search.includes('tab=tests'),
    },
    {
      label: 'WhatsApp',
      icon: WhatsAppIcon,
      href: 'https://wa.me/1234567890',
      isActive: false,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-[68px] px-1">
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
              className="group flex flex-col items-center justify-center w-full h-full outline-hidden touch-manipulation"
            >
              <div 
                className={`relative flex items-center justify-center w-[52px] h-[32px] mb-1 rounded-full transition-all duration-300 ease-out ${
                  item.isActive 
                    ? 'bg-blue-50 text-blue-600 scale-100' 
                    : 'bg-transparent text-slate-400 group-hover:bg-slate-50/80 group-hover:text-slate-600 scale-95 group-hover:scale-100'
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    item.isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'
                  }`} 
                />
              </div>
              <span 
                className={`text-[10px] tracking-wide transition-colors duration-300 ${
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
