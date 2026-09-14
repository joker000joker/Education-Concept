import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Note, Category } from '../types';
import { fetchNotes, getCategories } from '../lib/supabase';
import { getCategoryMeta, INITIAL_CATEGORIES } from '../data/categories';
import { NoteCard } from '../components/common/NoteCard';
import { BackButton } from '../components/common/BackButton';
import { DynamicIcon } from '../components/common/DynamicIcon';
import {
  Search,
  BookOpen,
  ArrowUpDown,
  Filter,
  Loader2,
  FileQuestion,
  GraduationCap,
} from 'lucide-react';

export const CategoryNotesPage: React.FC = () => {
  const { category: categoryParam } = useParams<{ category: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [categories, setCategories] = useState<Category[]>([]);

  // Decode and match category name/id from route param
  const rawParam = categoryParam ? decodeURIComponent(categoryParam).toLowerCase() : '';

  const matchedCategory = useMemo(() => {
    // Try by ID first
    const numericId = parseInt(rawParam, 10);
    if (!isNaN(numericId) && numericId > 0) {
      const byId = INITIAL_CATEGORIES.find((c) => c.id === numericId);
      if (byId) return byId;
    }

    // Try matching slug or name
    const byName = INITIAL_CATEGORIES.find(
      (c) =>
        c.name.toLowerCase() === rawParam ||
        c.name.toLowerCase().replace(/\s+/g, '-') === rawParam
    );
    if (byName) return byName;

    return getCategoryMeta(rawParam);
  }, [rawParam]);

  useEffect(() => {
    let isMounted = true;

    const loadCategoryNotes = async () => {
      try {
        setLoading(true);
        // Find category ID
        const catId = matchedCategory.id;
        const res = await fetchNotes({
          categoryId: catId,
          publishedOnly: true,
          sortBy,
        });

        if (isMounted) {
          setNotes(res.notes);
        }
      } catch (err) {
        console.error('Error fetching category notes:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCategoryNotes();

    return () => {
      isMounted = false;
    };
  }, [matchedCategory.id, sortBy]);

  // Client-side search within category
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const term = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(term) ||
        (n.description && n.description.toLowerCase().includes(term))
    );
  }, [notes, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackTo="/subjects" label="Back to Subjects" />
        <span className="text-xs font-semibold text-slate-400">
          Education Concept • {matchedCategory.name}
        </span>
      </div>

      {/* Category Hero Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border ${matchedCategory.borderColor} ${matchedCategory.bgColor} relative overflow-hidden`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className={`p-4 rounded-2xl bg-white shadow-xs border ${matchedCategory.borderColor} ${matchedCategory.color} shrink-0`}
          >
            <DynamicIcon name={matchedCategory.iconName} className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Subject Notes & Study Material
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {matchedCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              {matchedCategory.description}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="category-notes-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${matchedCategory.name} notes...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-2xs"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="category-sort-select"
            className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </label>
          <select
            id="category-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Notes Grid or Loading / Empty state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading {matchedCategory.name} notes...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} showCategoryBadge={false} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? 'No notes matched your query' : `No published notes yet in ${matchedCategory.name}`}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with different terms or clear the search input.'
              : 'Our academic contributors are currently drafting and reviewing notes for this subject. Check back soon!'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              Clear Search
            </button>
          ) : (
            <Link
              to="/subjects"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600"
            >
              <span>Explore Other Subjects</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
