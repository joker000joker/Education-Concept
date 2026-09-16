import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
  const showFooter = normalizedPath === '/' || normalizedPath === '/tests';

  if (!showFooter) return null;

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
          
          {/* Brand */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                EDUCATION CONCEPT
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 md:ml-10">
              Smart learning. Focused preparation.
            </p>
          </div>

          {/* Quick Access */}
          <div className="w-full md:w-auto">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 md:hidden">
              Quick Access
            </h4>
            <ul className="grid grid-cols-2 sm:flex sm:flex-row gap-x-4 gap-y-3 sm:gap-6 lg:gap-8 text-[13px] font-semibold text-slate-300">
              <li>
                <Link to="/paid-ebooks" className="hover:text-white transition-colors">Paid E-Books</Link>
              </li>
              <li>
                <Link to="/free-ebooks" className="hover:text-white transition-colors">Free E-Books</Link>
              </li>
              <li>
                <Link to="/notes" className="hover:text-white transition-colors">Notes</Link>
              </li>
              <li>
                <Link to="/current-affairs" className="hover:text-white transition-colors">Current Affairs</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-white transition-colors">Tests</Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Line */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-center md:justify-start">
          <p className="text-[11px] font-medium text-slate-500 tracking-wide">
            © 2026 Education Concept • All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

