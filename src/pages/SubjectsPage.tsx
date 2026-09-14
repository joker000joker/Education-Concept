import React, { useEffect, useState } from 'react';
import { Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { getCategories, fetchNotes } from '../lib/supabase';
import { CategoryCard } from '../components/common/CategoryCard';
import { BackButton } from '../components/common/BackButton';
import { Search, Library, Layers } from 'lucide-react';

export const SubjectsPage: React.FC = () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
  );
};
