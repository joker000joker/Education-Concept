import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, FileText, MessageCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
      isActive: path === '/',
    },
    {
      label: 'My Notes',
      icon: Bookmark,
      href: '/profile?tab=notes', // Connecting to a potential profile tab for saved notes
      isActive: path.includes('tab=notes'),
    },
    {
      label: 'My Tests',
      icon: FileText,
      href: '/profile?tab=tests', // Connecting to a potential profile tab for tests
      isActive: path.includes('tab=tests'),
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: 'https://wa.me/1234567890', // Default placeholder if no specific number exists
      isActive: false,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          item.href.startsWith('http') ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-green-600 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          ) : (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                item.isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-500'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.isActive ? 'fill-blue-100' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
};
