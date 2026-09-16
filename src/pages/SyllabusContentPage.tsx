import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Briefcase } from 'lucide-react';

export const SyllabusContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { category, exam, type } = useParams<{ category: string, exam: string, type: string }>();
  const decodedExam = decodeURIComponent(exam || '');

  const isPattern = type === 'pattern';
  const pageTitle = isPattern ? 'Exam Pattern' : 'Syllabus';
  const emptyTitle = isPattern ? 'No Exam Pattern Available' : 'No Syllabus Available';
  const emptySubtitle = isPattern ? 'Exam Pattern will appear here when available.' : 'Syllabus will appear here when available.';
  const Icon = isPattern ? Briefcase : FileText;

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(`/syllabus/${category}/${encodeURIComponent(exam || '')}`)} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">{pageTitle}</h1>
          <p className="text-xs text-slate-500">{decodedExam}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-12 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">{emptyTitle}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {emptySubtitle}
        </p>
      </div>
    </div>
  );
};
