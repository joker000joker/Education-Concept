import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Category, Note } from '../types';
import { INITIAL_CATEGORIES } from '../data/categories';
import { getCategories, fetchNotes } from '../lib/supabase';
import { CategoryCard } from '../components/common/CategoryCard';
import { NoteCard } from '../components/common/NoteCard';
import {
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Download,
  FileCheck2,
  Library,
  GraduationCap,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map((c) => ({ id: c.id, name: c.name }))
  );
  const [latestNotes, setLatestNotes] = useState<Note[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Load categories from Supabase (or fallback to INITIAL_CATEGORIES)
        const [catData, notesResult] = await Promise.all([
          getCategories().catch(() => []),
          fetchNotes({ publishedOnly: true, limit: 6, sortBy: 'newest' }).catch(() => ({
            notes: [],
            count: 0,
          })),
        ]);

        if (isMounted) {
          if (catData && catData.length > 0) {
            setCategories(catData);
          }
          setLatestNotes(notesResult.notes);

          // Calculate counts by category if possible
          const counts: Record<number, number> = {};
          notesResult.notes.forEach((n) => {
            if (n.category_id) {
              counts[n.category_id] = (counts[n.category_id] || 0) + 1;
            }
          });
          setCategoryCounts(counts);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/notes?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/notes');
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:py-16 bg-gradient-to-b from-blue-50/70 via-white to-transparent border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-700 border border-blue-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Comprehensive Study Materials & Revision Guides</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Master Every Topic with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                Education Concept
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Learn better. Revise faster. Achieve more. Discover carefully curated PDF notes and e-notes designed to strengthen your concepts, simplify revision, and support your exam preparation anytime, anywhere.
            </p>

            {/* Search Bar */}
            <form
              id="hero-search-form"
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row gap-2.5 p-2 bg-white rounded-2xl shadow-lg border border-slate-200/80 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all"
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  id="hero-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by topic, keyword, or note title (e.g., Calculus, Ancient History)..."
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                />
              </div>
              <button
                id="hero-search-btn"
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors shrink-0"
              >
                <span>Search Notes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Popular Subjects:</span>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/subjects/${encodeURIComponent(cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section: All 12 Categories as attractive cards */}
      <section id="subjects-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Library className="w-4 h-4" />
              <span>Categorized Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Academic Subjects
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Browse structured study materials organized into 12 essential disciplines.
            </p>
          </div>

          <Link
            id="view-all-subjects-btn"
            to="/subjects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group shrink-0"
          >
            <span>View All 12 Subjects</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              noteCount={categoryCounts[category.id]}
            />
          ))}
        </div>
      </section>

      {/* Latest Notes Section */}
      <section id="latest-notes-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Recent Uploads</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Latest Published Notes
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Recently updated notes with high-resolution diagrams, bullet summaries, and revision sheets.
            </p>
          </div>

          <Link
            id="view-all-notes-btn"
            to="/notes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group shrink-0"
          >
            <span>Browse All Notes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading educational notes...</p>
          </div>
        ) : latestNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Curating Quality Notes</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Our educators are continuously uploading new verified PDF notes. Check back shortly or browse through our subject categories.
            </p>
            <div className="pt-2">
              <Link
                to="/subjects"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                <span>Browse Subjects</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Platform Features / Guarantees Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Verified Educational Standard
            </span>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Designed for Focused, Distraction-Free Exam Preparation
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Education Concept is built from the ground up for students. No clickbait, no intrusive ads, and no complicated downloads. Just straightforward, syllabus-oriented notes ready to read on phone, tablet, or PC.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Syllabus-Aligned</h4>
                <p className="text-xs text-slate-400">Carefully structured by educators and academic specialists.</p>
              </div>

              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Fast & Offline Ready</h4>
                <p className="text-xs text-slate-400">Download high-res PDFs anytime to study without internet.</p>
              </div>

              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Mobile-Optimized</h4>
                <p className="text-xs text-slate-400">Built-in PDF reader with smooth zooming and page navigation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
