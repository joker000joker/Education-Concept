import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Note, Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { fetchNotes, getCategories } from '../lib/supabase';
import { NoteCard } from '../components/common/NoteCard';
import { BackButton } from '../components/common/BackButton';
import {
  Search,
  BookOpen,
  ArrowUpDown,
  Filter,
  Loader2,
  FileX2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 9;

export const BrowseNotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [search, setSearch] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sync categories
  useEffect(() => {
    getCategories()
      .then((data) => {
        if (data && data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Update query params when search / category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (selectedCategoryId !== 'all') params.set('category', selectedCategoryId);
    setSearchParams(params, { replace: true });
  }, [search, selectedCategoryId, setSearchParams]);

  // Fetch notes on dependency change
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      try {
        setLoading(true);
        const catId = selectedCategoryId !== 'all' ? parseInt(selectedCategoryId, 10) : null;
        const res = await fetchNotes({
          categoryId: catId,
          search: search.trim() || undefined,
          sortBy,
          publishedOnly: true,
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
        });

        if (isMounted) {
          setNotes(res.notes);
          setTotalCount(res.count);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId, search, sortBy, currentPage]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const handleCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top bar with back navigation */}
      <div className="flex items-center justify-between gap-4">
        <BackButton fallbackTo="/" label="Back to Home" />
        <span className="text-xs font-semibold text-slate-400">
          Showing {notes.length} of {totalCount} published notes
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Digital Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse Educational Notes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search across our comprehensive library of PDF notes, chapter breakdowns, and cheat sheets.
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="browse-notes-search-input"
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by note title or keyword..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              id="browse-category-select"
              value={selectedCategoryId}
              onChange={(e) => handleCategorySelect(e.target.value)}
              aria-label="Filter by subject"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Subjects (12)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              id="browse-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort notes by"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Quick category pill tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subjects
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.id.toString())}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategoryId === c.id.toString()
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Retrieving published notes...</p>
        </div>
      ) : notes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                id="pagination-prev-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Page {currentPage} of {totalPages}
              </span>

              <button
                id="pagination-next-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <FileX2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No notes found</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            We couldn't find any published notes matching your criteria. Try relaxing your filters or searching for different keywords.
          </p>
          {(search || selectedCategoryId !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategoryId('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
