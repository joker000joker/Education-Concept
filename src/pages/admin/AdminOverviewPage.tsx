import React from 'react';
import { Link } from 'react-router-dom';
import { Book, BookOpen, GraduationCap, Star, MessageCircle, Newspaper, Layers, Library, Image as ImageIcon, FileText } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';

export const AdminOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-4">
            <BackButton fallbackTo="/" label="Back to Homepage" forceFallback={true} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Education Concept repository management: manage modules, upload PDFs, and publish content.
          </p>
        </div>
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
