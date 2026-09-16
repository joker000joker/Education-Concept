import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileCheck2, BookOpen, Calculator, List } from 'lucide-react';

export const StudyResourcesListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();

  let title = 'Study Resources';
  let emptyTitle = 'No Resources Available';
  let emptySubtitle = 'Content will appear here when available.';
  let Icon = BookOpen;

  if (category === 'pyp') {
    title = 'Previous Year Papers';
    emptyTitle = 'No Previous Year Papers Available';
    Icon = FileCheck2;
  }
  if (category === 'practice-sets') {
    title = 'Practice Sets';
    emptyTitle = 'No Practice Sets Available';
    Icon = BookOpen;
  }
  if (category === 'formula') {
    title = 'Formula & Short Tricks';
    emptyTitle = 'No Formula & Short Tricks Available';
    Icon = Calculator;
  }
  if (category === 'one-liners') {
    title = 'One-Liners';
    emptyTitle = 'No One-Liners Available';
    Icon = List;
  }

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/resources')} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">{title}</h1>
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
