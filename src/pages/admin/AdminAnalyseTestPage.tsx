import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Award,
  Clock,
  Layers,
  Search,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { fetchSectionalTests } from '../../services/sectionalTestService';
import { SectionalTest } from '../../types';

interface StudentTestResultRow {
  id: string | number;
  test_id: number;
  user_id: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  incorrect_answers: number;
  unattempted_answers: number;
  accuracy: number;
  negative_marks: number;
  time_taken_seconds: number;
  completed_at: string;
  test_title?: string;
  subject?: string;
}

interface ProfileRecord {
  id: string;
  full_name?: string | null;
  name?: string | null;
  display_name?: string | null;
  username?: string | null;
  student_name?: string | null;
  role?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * Safely extract the registered student name from profile/account data.
 * Fallback to 'Anonymous User' only if genuinely empty.
 */
export function getRegisteredStudentName(
  userRecord: ProfileRecord | null | undefined,
  currentUser?: { id?: string; email?: string | null; user_metadata?: any } | null,
  currentProfile?: { id?: string; full_name?: string | null } | null
): string {
  if (!userRecord) return 'Anonymous User';

  // 1. If this record is the active session user, prioritize verified profile / user_metadata
  if (currentUser && userRecord.id && userRecord.id === currentUser.id) {
    if (currentProfile?.full_name?.trim()) {
      return currentProfile.full_name.trim();
    }
    if (currentUser.user_metadata?.full_name?.trim()) {
      return currentUser.user_metadata.full_name.trim();
    }
    if (currentUser.user_metadata?.name?.trim()) {
      return currentUser.user_metadata.name.trim();
    }
  }

  // 2. Read direct full_name or other existing saved name field from profile / account data
  const candidate =
    userRecord.full_name ||
    userRecord.name ||
    userRecord.display_name ||
    userRecord.student_name ||
    userRecord.username ||
    userRecord.raw_user_meta_data?.full_name ||
    userRecord.raw_user_meta_data?.name ||
    userRecord.user_metadata?.full_name ||
    userRecord.user_metadata?.name;

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  // Fallback if genuinely empty
  return 'Anonymous User';
}

export const AdminAnalyseTestPage: React.FC = () => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tests, setTests] = useState<SectionalTest[]>([]);
  const [allResults, setAllResults] = useState<StudentTestResultRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRecord>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. SELECT TEST state
  const paramTestId = searchParams.get('testId');
  const [selectedTestId, setSelectedTestId] = useState<string>(paramTestId || '');

  // Search filter for student performance table
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  // Filter for completion status table ('all' | 'completed' | 'not_attempted')
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'not_attempted'>('all');

  useEffect(() => {
    loadData();
  }, []);

  // Sync state if URL testId changes
  useEffect(() => {
    if (paramTestId && paramTestId !== selectedTestId) {
      setSelectedTestId(paramTestId);
    }
  }, [paramTestId]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch real existing tests
      const testsData = await fetchSectionalTests();
      setTests(testsData || []);

      const testsMap: Record<number, SectionalTest> = {};
      (testsData || []).forEach((t) => {
        testsMap[t.id] = t;
      });

      // If no test is selected yet, but URL has testId, or if there's only 1 test, handle cleanly
      if (!selectedTestId && paramTestId) {
        setSelectedTestId(paramTestId);
      }

      // 2. Fetch Profiles for student identity mapping
      let loadedProfiles: ProfileRecord[] = [];
      const profMap: Record<string, ProfileRecord> = {};
      if (isSupabaseConfigured) {
        try {
          const { data: profs, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (!profError && profs) {
            loadedProfiles = profs;
            profs.forEach((p: ProfileRecord) => {
              if (p.id) profMap[p.id] = p;
            });
          }
        } catch (err) {
          console.warn('[AdminAnalyseTest] Error fetching profiles:', err);
        }
      }
      setProfiles(loadedProfiles);
      setProfilesMap(profMap);

      // 3. Fetch Test Results from Supabase
      let fetchedResults: StudentTestResultRow[] = [];
      if (isSupabaseConfigured) {
        try {
          const { data: dbResults, error: resultsError } = await supabase
            .from('sectional_test_results')
            .select('*')
            .order('completed_at', { ascending: false });

          if (!resultsError && dbResults) {
            fetchedResults = dbResults.map((r: any) => {
              const testInfo = testsMap[Number(r.test_id)];
              return {
                id: r.id || `${r.test_id}_${r.user_id}`,
                test_id: Number(r.test_id),
                user_id: r.user_id,
                score: Number(r.score) || 0,
                total_marks: Number(r.total_marks) || testInfo?.total_marks || 50,
                correct_answers: Number(r.correct_answers) || 0,
                incorrect_answers: Number(r.incorrect_answers) || 0,
                unattempted_answers: Number(r.unattempted_answers) || 0,
                accuracy: Number(r.accuracy) || 0,
                negative_marks: Number(r.negative_marks) || 0,
                time_taken_seconds: Number(r.time_taken_seconds) || 0,
                completed_at: r.completed_at || r.created_at || new Date().toISOString(),
                test_title: testInfo?.title || `Test #${r.test_id}`,
                subject: testInfo?.subject || 'Sectional Test'
              };
            });
          }
        } catch (err) {
          console.warn('[AdminAnalyseTest] Error fetching results from Supabase:', err);
        }
      }

      // 4. Merge any local test attempts if offline/guest attempts exist
      try {
        const rawLocal = localStorage.getItem('ec_test_attempts_v1');
        if (rawLocal) {
          const localAttempts = JSON.parse(rawLocal);
          if (Array.isArray(localAttempts)) {
            localAttempts.forEach((att: any) => {
              const existingIdx = fetchedResults.findIndex(
                (fr) => fr.test_id === att.testId && fr.user_id === (currentUser?.id || 'guest')
              );
              if (existingIdx === -1) {
                const testInfo = testsMap[att.testId];
                fetchedResults.push({
                  id: `local_${att.testId}_${Date.now()}`,
                  test_id: att.testId,
                  user_id: currentUser?.id || 'guest',
                  score: Number(att.score) || 0,
                  total_marks: Number(att.totalMarks) || 50,
                  correct_answers: Number(att.correctCount) || 0,
                  incorrect_answers: Number(att.incorrectCount) || 0,
                  unattempted_answers: Number(att.unattemptedCount) || 0,
                  accuracy: Number(att.accuracy) || 0,
                  negative_marks: Number(att.negativeMarksTotal || 0),
                  time_taken_seconds: Number(att.timeTakenSeconds) || 0,
                  completed_at: att.submittedAt || new Date().toISOString(),
                  test_title: att.testTitle || testInfo?.title || `Test #${att.testId}`,
                  subject: att.subject || testInfo?.subject || 'Sectional Test'
                });
              }
            });
          }
        }
      } catch (localErr) {
        console.warn('[AdminAnalyseTest] Error checking local attempts:', localErr);
      }

      setAllResults(fetchedResults);
      if (isManualRefresh) {
        toast.show('Test analytics refreshed successfully', 'success');
      }
    } catch (err: any) {
      console.error('[AdminAnalyseTest] Error loading analytics data:', err);
      toast.show(err?.message || 'Failed to load test analytics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTestSelectionChange = (newTestId: string) => {
    setSelectedTestId(newTestId);
    if (newTestId) {
      setSearchParams({ testId: newTestId });
    } else {
      setSearchParams({});
    }
  };

  // Find the selected test object
  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return tests.find((t) => String(t.id) === String(selectedTestId)) || null;
  }, [tests, selectedTestId]);

  // Filter results for ONLY the currently selected test
  const testResults = useMemo(() => {
    if (!selectedTest) return [];
    return allResults.filter((r) => String(r.test_id) === String(selectedTest.id));
  }, [allResults, selectedTest]);

  // ---------------------------------------------------------------------------
  // 3. TEST OVERVIEW: EXACT 5 METRICS FOR SELECTED TEST
  // ---------------------------------------------------------------------------
  const totalAttempts = testResults.length;

  const uniqueStudents = useMemo(() => {
    const studentIds = new Set(testResults.map((r) => r.user_id));
    return studentIds.size;
  }, [testResults]);

  const totalCorrect = useMemo(() => {
    return testResults.reduce((sum, r) => sum + (Number(r.correct_answers) || 0), 0);
  }, [testResults]);

  const totalIncorrect = useMemo(() => {
    return testResults.reduce((sum, r) => sum + (Number(r.incorrect_answers) || 0), 0);
  }, [testResults]);

  const totalUnattempted = useMemo(() => {
    return testResults.reduce((sum, r) => sum + (Number(r.unattempted_answers) || 0), 0);
  }, [testResults]);

  // ---------------------------------------------------------------------------
  // 4. STUDENT-WISE PERFORMANCE FOR SELECTED TEST
  // ---------------------------------------------------------------------------
  const studentPerformanceList = useMemo(() => {
    if (!selectedTest) return [];

    return testResults.map((result) => {
      const studentProfile = profilesMap[result.user_id];
      const studentName = getRegisteredStudentName(studentProfile, currentUser, currentProfile);

      return {
        resultId: result.id,
        userId: result.user_id,
        studentName,
        attemptStatus: 'Completed' as const,
        score: result.score,
        totalMarks: result.total_marks,
        correct: result.correct_answers,
        incorrect: result.incorrect_answers,
        unattempted: result.unattempted_answers,
        completedAt: result.completed_at,
        timeTakenSeconds: result.time_taken_seconds
      };
    });
  }, [testResults, profilesMap, currentUser, currentProfile, selectedTest]);

  // Filtered student-wise performance list by search
  const filteredStudentPerformance = useMemo(() => {
    if (!studentSearchTerm.trim()) return studentPerformanceList;
    const q = studentSearchTerm.toLowerCase().trim();
    return studentPerformanceList.filter((s) => s.studentName.toLowerCase().includes(q));
  }, [studentPerformanceList, studentSearchTerm]);

  // ---------------------------------------------------------------------------
  // 5. TEST COMPLETION STATUS FOR SELECTED TEST
  // ---------------------------------------------------------------------------
  const studentCompletionRoster = useMemo(() => {
    if (!selectedTest) return [];

    // Filter to only student profiles (exclude admin if role is 'admin', or include all users)
    const studentProfiles = profiles.filter((p) => String(p.role).toLowerCase() !== 'admin');
    const attemptedUserIds = new Set(testResults.map((r) => r.user_id));

    // Results lookup
    const resultMap: Record<string, StudentTestResultRow> = {};
    testResults.forEach((r) => {
      resultMap[r.user_id] = r;
    });

    // Check if there is an in-progress active attempt saved in storage for this test
    let localActiveUserId: string | null = null;
    try {
      const activeRaw = localStorage.getItem(`ec_active_test_${selectedTest.id}`);
      if (activeRaw && currentUser?.id) {
        localActiveUserId = currentUser.id;
      }
    } catch {
      // Ignore
    }

    return studentProfiles.map((p) => {
      const studentName = getRegisteredStudentName(p, currentUser, currentProfile);
      const isCompleted = attemptedUserIds.has(p.id);
      const isInProgress = !isCompleted && localActiveUserId === p.id;

      let status: 'Completed' | 'Incomplete / In Progress' | 'Not Attempted' = 'Not Attempted';
      if (isCompleted) {
        status = 'Completed';
      } else if (isInProgress) {
        status = 'Incomplete / In Progress';
      }

      const attemptRecord = resultMap[p.id];

      return {
        userId: p.id,
        studentName,
        status,
        completedAt: attemptRecord?.completed_at || null,
        score: attemptRecord ? attemptRecord.score : null,
        totalMarks: attemptRecord ? attemptRecord.total_marks : null
      };
    });
  }, [selectedTest, profiles, testResults, currentUser, currentProfile]);

  const completedCount = useMemo(() => {
    return studentCompletionRoster.filter((s) => s.status === 'Completed').length;
  }, [studentCompletionRoster]);

  const notAttemptedCount = useMemo(() => {
    return studentCompletionRoster.filter((s) => s.status === 'Not Attempted').length;
  }, [studentCompletionRoster]);

  const inProgressCount = useMemo(() => {
    return studentCompletionRoster.filter((s) => s.status === 'Incomplete / In Progress').length;
  }, [studentCompletionRoster]);

  const filteredCompletionRoster = useMemo(() => {
    if (completionFilter === 'completed') {
      return studentCompletionRoster.filter((s) => s.status === 'Completed');
    }
    if (completionFilter === 'not_attempted') {
      return studentCompletionRoster.filter((s) => s.status === 'Not Attempted');
    }
    return studentCompletionRoster;
  }, [studentCompletionRoster, completionFilter]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>

      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3 h-3 text-purple-600" />
            Performance & Analytics
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Analyse Test
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select an assessment to view overview metrics, student-wise performance, and completion status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            title="Refresh test analytics"
          >
            <RefreshCw className={`w-4 h-4 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. SELECT TEST (First / Main Control)
         ===================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <label htmlFor="select-test-dropdown" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Select Test
        </label>
        <div className="relative">
          <select
            id="select-test-dropdown"
            value={selectedTestId}
            onChange={(e) => handleTestSelectionChange(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all cursor-pointer"
          >
            <option value="">-- Choose a Sectional Test to Analyse --</option>
            {tests.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.title} ({t.subject})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State: Prompt Admin to Select a Test */}
      {!selectedTest ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Please Select a Test</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Choose any existing sectional test from the selector above to view its overview metrics, student-wise performance, and completion status.
          </p>
        </div>
      ) : (
        <>
          {/* =====================================================================
              2. TEST NAME / SUBJECT
             ===================================================================== */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 inline-block mb-2">
                Subject: {selectedTest.subject}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedTest.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                Total Questions: <strong className="text-slate-900">{selectedTest.total_questions}</strong>
              </span>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                Total Marks: <strong className="text-slate-900">{selectedTest.total_marks}</strong>
              </span>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                Duration: <strong className="text-slate-900">{selectedTest.duration_minutes}m</strong>
              </span>
            </div>
          </div>

          {/* =====================================================================
              3. TEST OVERVIEW (EXACT 5 REQUIRED METRICS)
             ===================================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {/* 1. Total Attempts */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Total Attempts</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalAttempts}</p>
            </div>

            {/* 2. Unique Students */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Unique Students</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{uniqueStudents}</p>
            </div>

            {/* 3. Correct */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Correct</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{totalCorrect}</p>
            </div>

            {/* 4. Incorrect */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Incorrect</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-600">{totalIncorrect}</p>
            </div>

            {/* 5. Unattempted */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-center text-center sm:text-left col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-700">Unattempted</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-700">{totalUnattempted}</p>
            </div>
          </div>

          {/* =====================================================================
              4. STUDENT-WISE PERFORMANCE
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Student-wise Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Individual scorecards and answer breakdowns for students who attempted this test.
                </p>
              </div>

              {/* Student Search */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Search student name..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {studentPerformanceList.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No attempts recorded for this test</p>
                <p className="text-xs text-slate-400 mt-1">
                  When students submit their answers for "{selectedTest.title}", their individual performance will appear here.
                </p>
              </div>
            ) : filteredStudentPerformance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students match your search query "{studentSearchTerm}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 text-center">Attempt Status</th>
                      <th className="px-6 py-4 text-center">Score</th>
                      <th className="px-6 py-4 text-center text-emerald-700">Correct</th>
                      <th className="px-6 py-4 text-center text-rose-700">Incorrect</th>
                      <th className="px-6 py-4 text-center text-slate-700">Unattempted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudentPerformance.map((item) => (
                      <tr key={item.resultId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Name */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block truncate max-w-xs">
                            {item.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.userId ? `${item.userId.slice(0, 8)}...` : ''}
                          </span>
                        </td>

                        {/* Attempt Status */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {item.attemptStatus}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-extrabold text-purple-700">
                            {item.score}
                          </span>
                          <span className="text-xs text-slate-400 font-medium"> / {item.totalMarks}</span>
                        </td>

                        {/* Correct */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.correct}
                          </span>
                        </td>

                        {/* Incorrect */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <XCircle className="w-3.5 h-3.5" />
                            {item.incorrect}
                          </span>
                        </td>

                        {/* Unattempted */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-600">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {item.unattempted}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* =====================================================================
              5. TEST COMPLETION STATUS
             ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Test Completion Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Completion tracking across all registered students for "{selectedTest.title}".
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCompletionFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    completionFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({studentCompletionRoster.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    completionFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionFilter('not_attempted')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    completionFilter === 'not_attempted'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Not Attempted ({notAttemptedCount})
                </button>
              </div>
            </div>

            {/* Completion Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 bg-slate-50/60 border-b border-slate-100">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed</span>
                  <p className="text-lg font-black text-slate-900">{completedCount}</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Not Attempted</span>
                  <p className="text-lg font-black text-slate-900">{notAttemptedCount}</p>
                </div>
              </div>

              {inProgressCount > 0 && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">In Progress</span>
                    <p className="text-lg font-black text-slate-900">{inProgressCount}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Completion Roster Table */}
            {filteredCompletionRoster.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students found under this status filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Attempt Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompletionRoster.map((student) => (
                      <tr key={student.userId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          {student.studentName}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {student.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Completed
                            </span>
                          ) : student.status === 'Incomplete / In Progress' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              Not Attempted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right text-xs text-slate-500">
                          {student.status === 'Completed' && student.completedAt ? (
                            <span>
                              Score: <strong className="text-purple-700">{student.score}</strong>/{student.totalMarks} •{' '}
                              {new Date(student.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No attempt recorded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
