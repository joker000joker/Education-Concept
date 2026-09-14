import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ShieldCheck, Heart } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../../data/categories';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                EDUCATION CONCEPT
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A high-performance educational platform providing students and aspirants with syllabus-aligned, structured PDF notes and e-notes across 12 key disciplines.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Educational Materials
              </span>
            </div>
          </div>

          {/* Core Subjects Quick Access */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Subjects
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INITIAL_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/subjects/${encodeURIComponent(cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="text-xs text-slate-400 hover:text-white transition-colors truncate"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links & Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/subjects" className="hover:text-white transition-colors">
                  All Subjects
                </Link>
              </li>
              <li>
                <Link to="/notes" className="hover:text-white transition-colors">
                  Search & Browse Notes
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Register Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Education Concept. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for learners and educators with clean digital resources.
          </p>
        </div>
      </div>
    </footer>
  );
};
