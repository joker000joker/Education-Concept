import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getSubjectBySlug } from '../../data/sectionalSubjects';
import { fetchChapters, getSubCategoriesForSubject } from '../../services/chapterTestService';
import { Chapter } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Layers,
  FolderOpen
} from 'lucide-react';

export const ChapterListPage: React.FC = () => {
  const { subject: subjectSlug, subCategory: subCategoryRoute } = useParams<{ subject: string; subCategory?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectMeta = getSubjectBySlug(subjectSlug || '');

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if subject is divided into sub-categories (History, Geography, Reasoning, Chemistry)
  const subCategories = useMemo(() => {
    return subjectMeta ? getSubCategoriesForSubject(subjectMeta.name) : null;
  }, [subjectMeta?.name]);

  const rawSubParam = subCategoryRoute || searchParams.get('sub');
  const activeSubCategory = useMemo(() => {
    if (!subCategories || !rawSubParam) return null;
    return subCategories.find((sc) => sc.toLowerCase() === rawSubParam.toLowerCase()) || null;
  }, [subCategories, rawSubParam]);

  useEffect(() => {
    if (!subjectMeta) return;
    loadChapters();

    let lastFocus = Date.now();
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFocus > 10000) {
        lastFocus = Date.now();
        loadChapters({ silent: true });
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, [subjectMeta?.name]);

  const loadChapters = async (options?: { silent?: boolean }) => {
    if (!subjectMeta) return;
    if (!options?.silent) setLoading(true);
    try {
      const data = await fetchChapters(subjectMeta.name);
      setChapters(data);
    } catch (err) {
      console.warn('Failed to load chapters for subject', err);
    } finally {
      setLoading(false);
    }
  };

  if (!subjectMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Subject Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">Please select a valid subject from the list.</p>
          <Link
            to="/tests/chapter-wise"
            className="mt-4 inline-block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Back to Chapter Wise Tests
          </Link>
        </div>
      </div>
    );
  }

  const Icon = subjectMeta.icon;

  // Filter chapters based on active sub-category (if divided) and search term
  const relevantChapters = useMemo(() => {
    if (subCategories && activeSubCategory) {
      return chapters.filter(
        (c) => (c.sub_category || '').toLowerCase().trim() === activeSubCategory.toLowerCase().trim()
      );
    }
    return chapters;
  }, [chapters, subCategories, activeSubCategory]);

  const filteredChapters = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return relevantChapters;
    return relevantChapters.filter((c) => {
      return (
        c.name.toLowerCase().includes(term) ||
        (c.hindi_name && c.hindi_name.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    });
  }, [relevantChapters, searchTerm]);

  // Is this the Sub-categories level? (Subject has sub-categories, but none is active yet)
  const isSubCategoryLevel = subCategories && !activeSubCategory;

  return (
    <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
      {/* ========================================================================= */}
      {/* MOBILE HEADER (md:hidden) */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          {isSubCategoryLevel || !subCategories ? (
            <Link
              to="/tests/chapter-wise"
              className="p-1 -ml-1 rounded-lg text-slate-700 hover:text-blue-600 active:scale-95 transition-all shrink-0"
              aria-label="Back to Subjects"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>
          ) : (
            <button
              onClick={() => setSearchParams({})}
              className="p-1 -ml-1 rounded-lg text-slate-700 hover:text-blue-600 active:scale-95 transition-all shrink-0"
              aria-label="Back to Sub-categories"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {isSubCategoryLevel
                ? `${subjectMeta.name} Sub-categories`
                : activeSubCategory
                ? `${activeSubCategory}`
                : `${subjectMeta.name} Chapters`}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
              {isSubCategoryLevel
                ? `${subjectMeta.hindiName} • ${subCategories?.length || 0} Sub-categories`
                : activeSubCategory
                ? `${subjectMeta.name} • ${filteredChapters.length} ${filteredChapters.length === 1 ? 'Chapter' : 'Chapters'}`
                : `${subjectMeta.hindiName} • ${chapters.length} ${chapters.length === 1 ? 'Chapter' : 'Chapters'}`}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP HEADER (hidden md:block) */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white border-b border-[#E2ECFF] md:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {isSubCategoryLevel || !subCategories ? (
                <BackButton to="/tests/chapter-wise" forceFallback label="All Subjects" />
              ) : (
                <button
                  onClick={() => setSearchParams({})}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>Sub-categories</span>
                </button>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${subjectMeta.bg} ${subjectMeta.color} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                    <Link to="/tests/chapter-wise" className="hover:text-blue-600">
                      Chapter Wise
                    </Link>
                    <span>/</span>
                    <span className={activeSubCategory ? 'hover:text-blue-600 cursor-pointer' : 'text-slate-700 font-bold'}
                      onClick={() => activeSubCategory && setSearchParams({})}
                    >
                      {subjectMeta.name}
                    </span>
                    {activeSubCategory && (
                      <>
                        <span>/</span>
                        <span className="text-slate-700 font-bold">{activeSubCategory}</span>
                      </>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {isSubCategoryLevel
                      ? `${subjectMeta.name} Sub-categories`
                      : activeSubCategory
                      ? `${activeSubCategory} Chapters`
                      : `${subjectMeta.name} Chapters`}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {subjectMeta.hindiName}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {isSubCategoryLevel
                      ? `Select a sub-category in ${subjectMeta.name} to view its dedicated chapters`
                      : activeSubCategory
                      ? `Select a chapter in ${activeSubCategory} to practice chapter-wise assessment tests`
                      : 'Select a chapter to practice dedicated chapter-wise assessment tests'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar (Only shown at chapter level) */}
            {!isSubCategoryLevel && (
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chapter..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 md:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-8">
        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading...</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 1: SUB-CATEGORIES VIEW (For Divided Subjects) */}
        {/* ========================================================================= */}
        {!loading && isSubCategoryLevel && subCategories && (
          <div className="space-y-6">
            {/* Mobile Vertical Sub-category Cards */}
            <div className="md:hidden space-y-3">
              {subCategories.map((sc) => {
                const chapCount = chapters.filter(
                  (c) => (c.sub_category || '').toLowerCase().trim() === sc.toLowerCase().trim()
                ).length;

                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSearchParams({ sub: sc })}
                    className="w-full text-left flex items-center justify-between p-3.5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/30 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${subjectMeta.bg} ${subjectMeta.color} shadow-xs`}
                      >
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-wide leading-tight truncate">
                          {sc}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                          Sub-category
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                        {chapCount} {chapCount === 1 ? 'Chapter' : 'Chapters'}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop 3-Column Grid of Sub-category Cards */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {subCategories.map((sc) => {
                const chapCount = chapters.filter(
                  (c) => (c.sub_category || '').toLowerCase().trim() === sc.toLowerCase().trim()
                ).length;

                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSearchParams({ sub: sc })}
                    className="w-full text-left flex items-center justify-between p-5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-xl shadow-[#0C122A]/20 hover:border-blue-500/50 hover:shadow-blue-900/30 hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${subjectMeta.bg} ${subjectMeta.color} shadow-sm group-hover:scale-105 transition-transform`}
                      >
                        <Layers className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white tracking-wide leading-tight truncate group-hover:text-blue-300 transition-colors">
                          {sc}
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                          Sub-category
                        </p>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-2 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                          {chapCount} {chapCount === 1 ? 'Chapter' : 'Chapters'} available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 pl-3">
                      <div className="w-10 h-10 rounded-xl bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-all shadow-sm">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: CHAPTER LIST VIEW (Active Sub-category OR Non-divided Subject) */}
        {/* ========================================================================= */}
        {!loading && (!isSubCategoryLevel || !subCategories) && (
          <div className="space-y-4">
            {/* Quick Sub-category Switcher Tabs (For divided subjects) */}
            {subCategories && activeSubCategory && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Sub-categories</span>
                </button>
                {subCategories.map((sc) => {
                  const isSel = sc.toLowerCase() === activeSubCategory.toLowerCase();
                  const count = chapters.filter(
                    (c) => (c.sub_category || '').toLowerCase().trim() === sc.toLowerCase().trim()
                  ).length;
                  return (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setSearchParams({ sub: sc })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        isSel
                          ? 'bg-[#0C122A] text-white shadow-xs border border-[#1E2756]'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {sc} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mobile: Full-Width Vertical Cards */}
            {filteredChapters.length > 0 && (
              <div className="md:hidden space-y-3">
                {filteredChapters.map((chap) => {
                  const testCount = chap.test_count || 0;

                  return (
                    <Link
                      key={chap.id}
                      to={`/tests/chapter-wise/${subjectMeta.slug}/${chap.id}${
                        activeSubCategory ? `?sub=${encodeURIComponent(activeSubCategory)}` : ''
                      }`}
                      className="flex items-center justify-between p-3.5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/30 active:scale-[0.98] transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${subjectMeta.bg} ${subjectMeta.color} shadow-xs`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white tracking-wide leading-tight truncate">
                            {chap.name}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                            Chapter Wise Test
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                          {testCount} {testCount === 1 ? 'Test' : 'Tests'}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Desktop: Grid of Chapters (EC-Style Dark Navy Rounded Cards - 3 Column Layout) */}
            {filteredChapters.length > 0 && (
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {filteredChapters.map((chap) => {
                  const testCount = chap.test_count || 0;

                  return (
                    <Link
                      key={chap.id}
                      to={`/tests/chapter-wise/${subjectMeta.slug}/${chap.id}${
                        activeSubCategory ? `?sub=${encodeURIComponent(activeSubCategory)}` : ''
                      }`}
                      className="flex items-center justify-between p-5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-xl shadow-[#0C122A]/20 hover:border-blue-500/50 hover:shadow-blue-900/30 hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${subjectMeta.bg} ${subjectMeta.color} shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white tracking-wide leading-tight truncate group-hover:text-blue-300 transition-colors">
                            {chap.name}
                          </h3>
                          <p className="text-xs font-medium text-slate-400 mt-1">
                            Chapter Wise Test
                          </p>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-1.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                            {testCount} {testCount === 1 ? 'Test' : 'Tests'} available
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0 pl-3">
                        <div className="w-10 h-10 rounded-xl bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-all shadow-sm">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Empty State for Chapter list */}
            {relevantChapters.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">No chapters available yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {activeSubCategory
                    ? `Chapters for ${activeSubCategory} (${subjectMeta.name}) are currently being added.`
                    : `Chapters for ${subjectMeta.name} are currently being updated.`}{' '}
                  Please check back soon or browse another section.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {activeSubCategory && (
                    <button
                      type="button"
                      onClick={() => setSearchParams({})}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Browse Other Sub-categories
                    </button>
                  )}
                  <Link
                    to="/tests/chapter-wise"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors"
                  >
                    Browse Other Subjects
                  </Link>
                </div>
              </div>
            )}

            {/* Search Not Found */}
            {relevantChapters.length > 0 && filteredChapters.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">No chapter found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  No matching chapter found for "{searchTerm}". Please try a different query.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
