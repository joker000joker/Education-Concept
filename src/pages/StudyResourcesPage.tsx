import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileCheck2, BookOpen, Calculator, List } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const StudyResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const RESOURCES = [
    { id: 'pyp', title: 'Previous Year Papers', icon: FileCheck2, bg: 'bg-rose-100', color: 'text-rose-600', dbCategory: 'Previous Year Papers' },
    { id: 'practice-sets', title: 'Practice Sets', icon: BookOpen, bg: 'bg-blue-100', color: 'text-blue-600', dbCategory: 'Practice Sets' },
    { id: 'formula', title: 'Formula & Short Tricks', icon: Calculator, bg: 'bg-purple-100', color: 'text-purple-600', dbCategory: 'Formula & Short Tricks' },
    { id: 'one-liners', title: 'One-Liners', icon: List, bg: 'bg-emerald-100', color: 'text-emerald-600', dbCategory: 'One-Liners' }
  ];

  useEffect(() => {
    loadCategoryCounts();
  }, []);

  const loadCategoryCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('study_resources')
        .select('category')
        .eq('published', true);

      if (error) throw error;
      const countMap: Record<string, number> = {};
      (data || []).forEach((row: { category: string }) => {
        countMap[row.category] = (countMap[row.category] || 0) + 1;
      });
      setCounts(countMap);
    } catch (err) {
      console.error('Error fetching resource counts:', err);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8 max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Study Resources</h1>
          <p className="text-xs text-slate-500">Comprehensive study PDFs, practice sets & quick revision notes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {RESOURCES.map((res) => {
          const count = counts[res.dbCategory] || 0;
          return (
            <Link
              key={res.id}
              to={`/resources/${res.id}`}
              className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform cursor-pointer group hover:border-[#2D3870]"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${res.bg} ${res.color} group-hover:scale-105 transition-transform`}>
                <res.icon className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide truncate">{res.title}</h3>
                  {count > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                      {count} {count === 1 ? 'file' : 'files'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Explore {res.title.toLowerCase()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
