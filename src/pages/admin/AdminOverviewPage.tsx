import React from 'react';
import { Link } from 'react-router-dom';
import {
  Book,
  BookOpen,
  GraduationCap,
  Star,
  MessageCircle,
  Newspaper,
  Layers,
  Library,
  Image as ImageIcon,
  FileText,
  Grid,
  CheckSquare,
  FileQuestion,
  Ticket
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#CBD5E1] mt-1">
          Education Concept repository management: manage modules, upload PDFs, create sectional tests, and publish content.
        </p>
      </div>

      {/* Test Modules Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/sectional-test"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/40 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 transition-colors group"
        >
          <Grid className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-purple-900 dark:text-purple-200 text-center">Sectional Tests</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">Active</span>
        </Link>
        <Link
          to="/admin/daily-quiz"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#141C2E] hover:bg-slate-100 dark:hover:bg-[#1B263B] transition-colors group opacity-75"
        >
          <CheckSquare className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">Daily Quiz</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Coming Soon</span>
        </Link>
        <Link
          to="/admin/chapter-test"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-yellow-200 dark:border-yellow-800/60 bg-yellow-50/50 dark:bg-yellow-950/40 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/50 transition-colors group"
        >
          <FileQuestion className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-yellow-900 dark:text-yellow-200 text-center">Chapter Wise Test</span>
          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold mt-0.5">Active</span>
        </Link>
        <Link
          to="/admin/test-pass"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#141C2E] hover:bg-slate-100 dark:hover:bg-[#1B263B] transition-colors group opacity-75"
        >
          <Ticket className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">Test Pass</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Coming Soon</span>
        </Link>
      </div>
      
      {/* EC Notes / Content Management Quick Links */}
      <div className="bg-white dark:bg-[#141C2E] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Content Management Modules</h2>
            <p className="text-xs text-slate-500 dark:text-[#CBD5E1] mt-0.5">Manage all Phase A modules for EC Notes.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/admin/notes" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-center">Notes</span>
          </Link>
          <Link to="/admin/paid-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-colors group">
            <Book className="w-6 h-6 text-rose-500 dark:text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-rose-700 dark:group-hover:text-rose-300 text-center">Paid E-Books</span>
          </Link>
          <Link to="/admin/free-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-green-50 dark:hover:bg-green-950/40 hover:border-green-200 dark:hover:border-green-800 transition-colors group">
            <BookOpen className="w-6 h-6 text-green-500 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-green-700 dark:group-hover:text-green-300 text-center">Free E-Books</span>
          </Link>
          <Link to="/admin/current-affairs" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
            <Newspaper className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-center">Current Affairs</span>
          </Link>
          <Link to="/admin/exam-pattern" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800 transition-colors group">
            <GraduationCap className="w-6 h-6 text-amber-500 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 text-center">Exam Pattern & Syllabus</span>
          </Link>
          <Link to="/admin/study-resources" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors group">
            <Library className="w-6 h-6 text-cyan-500 dark:text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 text-center">Study Resources</span>
          </Link>
          <Link to="/admin/banners" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-200 dark:hover:border-purple-800 transition-colors group">
            <ImageIcon className="w-6 h-6 text-purple-500 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 text-center">Home Banners</span>
          </Link>
          <Link to="/admin/recommendations" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 hover:border-fuchsia-200 dark:hover:border-fuchsia-800 transition-colors group">
            <Star className="w-6 h-6 text-fuchsia-500 dark:text-fuchsia-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-300 text-center">Top Recommendations</span>
          </Link>
          <Link to="/admin/whatsapp" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1B263B] hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-200 dark:hover:border-teal-800 transition-colors group">
            <MessageCircle className="w-6 h-6 text-teal-500 dark:text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300 text-center">WhatsApp Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
