import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONAL_SUBJECTS_LIST, SubjectMeta } from '../../data/sectionalSubjects';
import { fetchSectionalTests } from '../../services/sectionalTestService';
import { SectionalTest } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { Search, ArrowRight, ArrowLeft, ChevronRight, Layers, Award, Sparkles, BookOpen } from 'lucide-react';

export const SectionalSubjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [testCounts, setTestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestCounts();
  }, []);

  const loadTestCounts = async () => {
    try {
      const tests = await fetchSectionalTests({ publishedOnly: true });
      const counts: Record<string, number> = {};
      tests.forEach((t) => {
        const key = (t.subject || '').toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
      setTestCounts(counts);
    } catch (err) {
      console.warn('Failed to load test counts', err);
    } finally {
      setLoading(false);
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
              Sectional Tests
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
              <BackButton to="/tests" forceFallback label="EC Test" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Subject-Wise Sectional Test
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sectional Tests
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
            const count = testCounts[subject.name.toLowerCase()] || 0;

            return (
              <Link
                key={subject.slug}
                to={`/tests/sectional/${subject.slug}`}
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
                      Sectional Test
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                  {count > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                      {count} {count === 1 ? 'Test' : 'Tests'}
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-lg bg-[#151D42] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop: Grid of 12 Subjects (Unchanged) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredSubjects.map((subject) => {
            const Icon = subject.icon;
            const count = testCounts[subject.name.toLowerCase()] || 0;

            return (
              <Link
                key={subject.slug}
                to={`/tests/sectional/${subject.slug}`}
                className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:border-purple-300 transition-all duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${subject.bg} ${subject.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        count > 0
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {loading ? '...' : count > 0 ? `${count} ${count === 1 ? 'Test' : 'Tests'}` : 'New Tests Soon'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs font-semibold text-purple-600/80 mt-0.5">
                    {subject.hindiName}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {subject.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-purple-700 transition-colors">
                  <span>View Tests</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-purple-600" />
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
