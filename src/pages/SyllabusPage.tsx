import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { SscEbooksIcon, RailwaysEbooksIcon, StateExamsEbooksIcon } from '../components/icons/PremiumServiceIcons';

export const SyllabusPage: React.FC = () => {
  const navigate = useNavigate();

  const CATEGORIES = [
    { id: 'ssc', title: 'SSC', icon: SscEbooksIcon, bg: 'bg-blue-100', color: 'text-blue-500' },
    { id: 'railway', title: 'RAILWAY', icon: RailwaysEbooksIcon, bg: 'bg-emerald-100', color: 'text-emerald-500' },
    { id: 'state-exams', title: 'STATE EXAMS', icon: StateExamsEbooksIcon, bg: 'bg-purple-100', color: 'text-purple-500' }
  ];

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Exam Pattern & Syllabus</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/syllabus/${cat.id}`}
            className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.color}`}>
              <cat.icon className="w-9 h-9" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white tracking-wide">{cat.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">View patterns and syllabus</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
