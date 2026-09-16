import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Category } from '../types';
import { INITIAL_CATEGORIES, getCategoryMeta } from '../data/categories';
import { getCategories, fetchNotes } from '../lib/supabase';
import { CategoryCard } from '../components/common/CategoryCard';
import { BackButton } from '../components/common/BackButton';
import { Search, Library, Layers, ChevronLeft } from 'lucide-react';
import {
  MathIcon,
  HistoryIcon,
  GeographyIcon,
  PolityIcon,
  EconomicsIcon,
  PhysicsIcon,
  ChemistryIcon,
  BiologyIcon,
  CurrentAffairsSubjectIcon,
  HindiIcon,
  StaticGkIcon,
  OtherNotesIcon
} from '../components/icons/PremiumSubjectIcons';

const getSubjectIcon = (id: number) => {
  switch (id) {
    case 1: return MathIcon;
    case 2: return HistoryIcon;
    case 3: return GeographyIcon;
    case 4: return PolityIcon;
    case 5: return EconomicsIcon;
    case 6: return PhysicsIcon;
    case 7: return ChemistryIcon;
    case 8: return BiologyIcon;
    case 9: return CurrentAffairsSubjectIcon;
    case 10: return HindiIcon;
    case 11: return StaticGkIcon;
    case 12: return OtherNotesIcon;
    default: return OtherNotesIcon;
  }
};

const getSubjectColor = (id: number) => {
  switch (id) {
    case 1: return { bg: 'bg-blue-100', color: 'text-blue-500' };
    case 2: return { bg: 'bg-amber-100', color: 'text-amber-500' };
    case 3: return { bg: 'bg-emerald-100', color: 'text-emerald-500' };
    case 4: return { bg: 'bg-indigo-100', color: 'text-indigo-500' };
    case 5: return { bg: 'bg-cyan-100', color: 'text-cyan-500' };
    case 6: return { bg: 'bg-violet-100', color: 'text-violet-500' };
    case 7: return { bg: 'bg-teal-100', color: 'text-teal-500' };
    case 8: return { bg: 'bg-rose-100', color: 'text-rose-500' };
    case 9: return { bg: 'bg-orange-100', color: 'text-orange-500' };
    case 10: return { bg: 'bg-red-100', color: 'text-red-500' };
    case 11: return { bg: 'bg-purple-100', color: 'text-purple-500' };
    case 12: return { bg: 'bg-slate-100', color: 'text-slate-500' };
    default: return { bg: 'bg-blue-100', color: 'text-blue-500' };
  }
};

export const SubjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [catData, notesData] = await Promise.all([
          getCategories().catch(() => []),
          fetchNotes({ publishedOnly: true }).catch(() => ({ notes: [], count: 0 })),
        ]);

        if (isMounted) {
          if (catData && catData.length > 0) {
            setCategories(catData);
          }
          const tally: Record<number, number> = {};
          notesData.notes.forEach((n) => {
            if (n.category_id) {
              tally[n.category_id] = (tally[n.category_id] || 0) + 1;
            }
          });
          setCounts(tally);
        }
      } catch (err) {
        console.error('Error in SubjectsPage:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* MOBILE UI */}
      <div className="block lg:hidden px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notes</h1>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm"
          />
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredCategories.map((category) => {
              const meta = getCategoryMeta(category.id);
              const Icon = getSubjectIcon(category.id);
              const color = getSubjectColor(category.id);
              return (
                <Link
                  key={category.id}
                  to={`/subjects/${category.id}`}
                  className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${color.bg} ${color.color}`}>
                    <Icon className="w-9 h-9" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-base font-bold text-white tracking-wide truncate">{category.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{meta.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No subjects found.
          </div>
        )}
      </div>

      {/* DESKTOP UI */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top navigation row */}
        <div className="flex items-center justify-between gap-4">
          <BackButton fallbackTo="/" />
          <span className="text-xs font-semibold text-slate-400">
            Education Concept Curriculum
          </span>
        </div>

        {/* Header and search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Library className="w-4 h-4" />
              <span>Academic Disciplines</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Educational Subjects
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select a discipline to view verified PDF study notes and revision summaries.
            </p>
          </div>

          {/* Filter input */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="subject-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter subjects..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                noteCount={counts[category.id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching subjects found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keyword or browse all 12 core subjects.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>
    </>
  );
};
