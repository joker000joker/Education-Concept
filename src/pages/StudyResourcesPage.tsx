import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileCheck2, BookOpen, Calculator, List } from 'lucide-react';

export const StudyResourcesPage: React.FC = () => {
  const navigate = useNavigate();

  const RESOURCES = [
    { id: 'pyp', title: 'Previous Year Papers', icon: FileCheck2, bg: 'bg-rose-100', color: 'text-rose-600' },
    { id: 'practice-sets', title: 'Practice Sets', icon: BookOpen, bg: 'bg-blue-100', color: 'text-blue-600' },
    { id: 'formula', title: 'Formula & Short Tricks', icon: Calculator, bg: 'bg-purple-100', color: 'text-purple-600' },
    { id: 'one-liners', title: 'One-Liners', icon: List, bg: 'bg-emerald-100', color: 'text-emerald-600' }
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Study Resources</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {RESOURCES.map((res) => (
          <Link
            key={res.id}
            to={`/resources/${res.id}`}
            className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${res.bg} ${res.color}`}>
              <res.icon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white tracking-wide">{res.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Explore {res.title.toLowerCase()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
