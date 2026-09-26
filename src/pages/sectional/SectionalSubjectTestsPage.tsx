import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSubjectBySlug, SECTIONAL_SUBJECTS_LIST } from '../../data/sectionalSubjects';
import { fetchSectionalTests, fetchUserSectionalResults } from '../../services/sectionalTestService';
import { SectionalTest, SectionalTestResult } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  HelpCircle,
  Award,
  AlertCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  Calendar,
  BarChart3,
  RotateCcw
} from 'lucide-react';

export const SectionalSubjectTestsPage: React.FC = () => {
  const { subject: subjectSlug } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tests, setTests] = useState<SectionalTest[]>([]);
  const [userResults, setUserResults] = useState<Record<number, SectionalTestResult>>({});
  const [loading, setLoading] = useState(true);

  const subjectMeta = getSubjectBySlug(subjectSlug || '');

  useEffect(() => {
    if (!subjectMeta) {
      return;
    }
    loadTests();

    const onFocus = () => {
      loadTests();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, [subjectMeta?.name]);

  useEffect(() => {
    if (user) {
      fetchUserSectionalResults(user.id).then(setUserResults);
    } else {
      setUserResults({});
    }
  }, [user?.id]);

  const loadTests = async () => {
    if (!subjectMeta) return;
    setLoading(true);
    try {
      const data = await fetchSectionalTests({
        subject: subjectMeta.name,
        publishedOnly: true
      });
      setTests(data);

      if (user) {
        const results = await fetchUserSectionalResults(user.id);
        setUserResults(results);
      }
    } catch (err) {
      console.warn('Failed to load tests for subject', err);
    } finally {
      setLoading(false);
    }
  };

  if (!subjectMeta) {
    return (
      <div className="min-h-screen p-8 bg-[#F4F8FF] md:bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-lg border border-slate-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Subject Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested subject does not match any of the 12 core sectional subjects.
          </p>
          <Link
            to="/tests/sectional"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
          >
            Back to Subjects
          </Link>
        </div>
      </div>
    );
  }

  const Icon = subjectMeta.icon;

  return (
    <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
      {/* Mobile Compact Header (md:hidden) */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        {/* Back Link */}
        <div>
          <Link
            to="/tests/sectional"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 active:scale-95 transition-all py-0.5 mb-2.5"
            aria-label="Back to Subjects"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Subjects</span>
          </Link>
        </div>

        {/* Subject Identity: Icon, Name & Test Count */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${subjectMeta.bg} ${subjectMeta.color} flex items-center justify-center shrink-0 shadow-2xs`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
              {subjectMeta.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
              {tests.length} {tests.length === 1 ? 'Test Available' : 'Tests Available'}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Header (hidden md:block) */}
      <div className="hidden md:block bg-white border-b border-[#E2ECFF] md:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton fallbackTo="/tests/sectional" forceFallback label="Subjects" />
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${subjectMeta.bg} ${subjectMeta.color} flex items-center justify-center shrink-0 shadow-2xs`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {subjectMeta.name}
                    </h1>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {subjectMeta.hindiName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                    {subjectMeta.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 self-start sm:self-auto">
              <Layers className="w-3.5 h-3.5" />
              <span>{tests.length} {tests.length === 1 ? 'Test Available' : 'Tests Available'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tests Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Mobile Section Title: Available Tests */}
        <div className="md:hidden mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Available Tests
          </h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                  <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : tests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tests.map((test) => {
              const userResult = user ? userResults[test.id] : null;

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 p-6 shadow-2xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {userResult && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Score: {userResult.score}/{userResult.total_marks}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        {test.duration_minutes} Mins
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors leading-snug mb-3">
                      {test.title}
                    </h3>

                    {/* Test Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-4 text-center">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Questions</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">{test.total_questions}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Marks</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">{test.total_marks}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Neg. Mark</p>
                        <p className="text-sm font-extrabold text-rose-600 mt-0.5">-{test.negative_marking}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    {userResult ? (
                      /* Logged in with completed test: Analyse + Reattempt */
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/tests/sectional/test/${test.id}?mode=analyse`}
                          className="inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Analyse</span>
                        </Link>
                        <Link
                          to={`/tests/sectional/test/${test.id}?reattempt=true`}
                          className="inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all group-hover:scale-[1.01]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reattempt</span>
                        </Link>
                      </div>
                    ) : (
                      /* First time / No result: Start Test */
                      <Link
                        to={`/tests/sectional/test/${test.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all group-hover:scale-[1.01]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Test</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-slate-200 max-w-lg mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No Sectional Tests Available
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Mock tests for <strong>{subjectMeta.name}</strong> ({subjectMeta.hindiName}) will be uploaded by the faculty shortly.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/tests/sectional"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
              >
                Browse Other Subjects
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
