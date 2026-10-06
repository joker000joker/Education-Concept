import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONAL_SUBJECTS_LIST } from '../../data/sectionalSubjects';
import { BackButton } from '../../components/common/BackButton';
import {
  fetchChapters,
  fetchChapterTests,
  CHAPTER_DATA_CHANGED_EVENT
} from '../../services/chapterTestService';
import { Search, ArrowRight, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';

export const ChapterSubjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectStats, setSubjectStats] = useState<Record<string, { chapters: number; tests: number }>>({});

  useEffect(() => {
    loadStats();

    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    };
    const onDataChanged = () => {
      loadStats();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
    window.addEventListener('storage', onDataChanged);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
      window.removeEventListener('storage', onDataChanged);
    };
  }, []);

  const loadStats = async () => {
    try {
      const [allChapters, allTests] = await Promise.all([
        fetchChapters(),
        fetchChapterTests({ publishedOnly: true })
      ]);

      const stats: Record<string, { chapters: number; tests: number }> = {};
      SECTIONAL_SUBJECTS_LIST.forEach((s) => {
        const key = s.name.toLowerCase();
        stats[key] = { chapters: 0, tests: 0 };
      });

      const chapterSubjectMap = new Map<number, string>();
      allChapters.forEach((c) => {
        let key = (c.subject || '').toLowerCase().trim();
        if (key === 'math') key = 'mathematics';
        chapterSubjectMap.set(Number(c.id), key);
        if (stats[key]) {
          stats[key].chapters += 1;
        }
      });

      allTests.forEach((t) => {
        let key = (t.subject || '').toLowerCase().trim() || chapterSubjectMap.get(Number(t.chapter_id));
        if (key === 'math') key = 'mathematics';
        if (key && stats[key]) {
          stats[key].tests += 1;
        }
      });

      setSubjectStats(stats);
    } catch (err) {
      console.warn('Failed to load chapter subjects stats', err);
    }
  };

  const filteredSubjects = SECTIONAL_SUBJECTS_LIST.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.hindiName.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
      {/* Mobile Compact Header (md:hidden) */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            to="/?tab=test"
            className="p-1 -ml-1 rounded-lg text-slate-700 hover:text-blue-600 active:scale-95 transition-all shrink-0"
            aria-label="Back to EC Test Home"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              Chapter Wise Tests
            </h1>
            <p className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
              12 Subjects
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Header (hidden md:block) */}
      <div className="hidden md:block bg-white border-b border-[#E2ECFF] md:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton to="/?tab=test" forceFallback label="EC Test" />
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Chapter Wise Tests
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select any of the 12 core competitive exam subjects to begin
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 md:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-8">
        {/* Mobile: Full-Width Vertical Cards */}
        <div className="md:hidden space-y-3">
          {filteredSubjects.map((subject) => {
            const Icon = subject.icon;

            return (
              <Link
                key={subject.slug}
                to={`/tests/chapter-wise/${subject.slug}`}
                className="flex items-center justify-between p-3.5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/30 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${subject.bg} ${subject.color} shadow-xs`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-wide leading-tight truncate">
                      {subject.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {subjectStats[subject.name.toLowerCase()]?.chapters
                        ? `${subjectStats[subject.name.toLowerCase()].chapters} ${subjectStats[subject.name.toLowerCase()].chapters === 1 ? 'Chapter' : 'Chapters'} • ${subjectStats[subject.name.toLowerCase()].tests} ${subjectStats[subject.name.toLowerCase()].tests === 1 ? 'Test' : 'Tests'}`
                        : 'Chapter Wise Test'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <div className="w-7 h-7 rounded-lg bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop: Grid of 12 Subjects (EC-Style Dark Navy Rounded Cards - 3 Column Layout) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {filteredSubjects.map((subject) => {
            const Icon = subject.icon;

            return (
              <Link
                key={subject.slug}
                to={`/tests/chapter-wise/${subject.slug}`}
                className="flex items-center justify-between p-5 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-xl shadow-[#0C122A]/20 hover:border-blue-500/50 hover:shadow-blue-900/30 hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${subject.bg} ${subject.color} shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight truncate group-hover:text-blue-300 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      {subjectStats[subject.name.toLowerCase()]?.chapters
                        ? `${subjectStats[subject.name.toLowerCase()].chapters} ${subjectStats[subject.name.toLowerCase()].chapters === 1 ? 'Chapter' : 'Chapters'} • ${subjectStats[subject.name.toLowerCase()].tests} ${subjectStats[subject.name.toLowerCase()].tests === 1 ? 'Test' : 'Tests'} available`
                        : 'Chapter Wise Test'}
                    </p>
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

        {filteredSubjects.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No subject found</h4>
            <p className="text-xs text-slate-500 mt-1">
              No matching subject found for "{searchTerm}". Please try a different query.
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
    </div>
  );
};
