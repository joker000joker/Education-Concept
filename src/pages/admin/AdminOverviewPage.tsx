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
import { BackButton } from '../../components/common/BackButton';

export const AdminOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div>
        <div className="mb-4">
          <BackButton fallbackTo="/" label="Back to Homepage" forceFallback={true} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Education Concept repository management: manage modules, upload PDFs, create sectional tests, and publish content.
        </p>
      </div>

      {/* Test Modules Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/sectional-test"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 transition-colors group"
        >
          <Grid className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-purple-900 text-center">Sectional Tests</span>
          <span className="text-[10px] text-purple-600 font-semibold mt-0.5">Active</span>
        </Link>
        <Link
          to="/admin/daily-quiz"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group opacity-75"
        >
          <CheckSquare className="w-5 h-5 text-slate-500 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700 text-center">Daily Quiz</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Coming Soon</span>
        </Link>
        <Link
          to="/admin/chapter-test"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group opacity-75"
        >
          <FileQuestion className="w-5 h-5 text-slate-500 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700 text-center">Chapter Wise</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Coming Soon</span>
        </Link>
        <Link
          to="/admin/test-pass"
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group opacity-75"
        >
          <Ticket className="w-5 h-5 text-slate-500 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700 text-center">Test Pass</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Coming Soon</span>
        </Link>
      </div>
      
      {/* EC Notes / Content Management Quick Links */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Content Management Modules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage all Phase A modules for EC Notes.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/admin/notes" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
            <FileText className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 text-center">Notes</span>
          </Link>
          <Link to="/admin/paid-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 transition-colors group">
            <Book className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-700 text-center">Paid E-Books</span>
          </Link>
          <Link to="/admin/free-ebooks" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-green-50 hover:border-green-200 transition-colors group">
            <BookOpen className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-green-700 text-center">Free E-Books</span>
          </Link>
          <Link to="/admin/current-affairs" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
            <Newspaper className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 text-center">Current Affairs</span>
          </Link>
          <Link to="/admin/exam-pattern" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-colors group">
            <GraduationCap className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 text-center">Exam Pattern & Syllabus</span>
          </Link>
          <Link to="/admin/study-resources" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 transition-colors group">
            <Library className="w-6 h-6 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700 text-center">Study Resources</span>
          </Link>
          <Link to="/admin/banners" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition-colors group">
            <ImageIcon className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-700 text-center">Home Banners</span>
          </Link>
          <Link to="/admin/recommendations" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-fuchsia-50 hover:border-fuchsia-200 transition-colors group">
            <Star className="w-6 h-6 text-fuchsia-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-fuchsia-700 text-center">Top Recommendations</span>
          </Link>
          <Link to="/admin/whatsapp" className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
            <MessageCircle className="w-6 h-6 text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 text-center">WhatsApp Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
