import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchChapterTestById,
  fetchChapterQuestions,
  saveLatestChapterResult,
  fetchLatestChapterStudentResult,
  CHAPTER_DATA_CHANGED_EVENT
} from '../../services/chapterTestService';
import { ChapterTest, ChapterQuestion, ChapterTestResult, StoredQuestionAnswer } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { getSubjectByName } from '../../data/sectionalSubjects';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  AlertTriangle,
  Award,
  BarChart3,
  ShieldCheck,
  Check,
  X,
  Layers,
  ArrowLeft,
  Eye,
  Percent,
  Timer,
  BookOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';

type TestMode = 'instructions' | 'taking' | 'result' | 'review';

export const ChapterTestTakePage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAnalyseRequested = searchParams.get('mode') === 'analyse';
  const isReattemptRequested = searchParams.get('reattempt') === 'true';

  const [test, setTest] = useState<ChapterTest | null>(null);
  const [questions, setQuestions] = useState<ChapterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<TestMode>('instructions');

  // Stored latest result for this student (if completed)
  const [existingResult, setExistingResult] = useState<ChapterTestResult | null>(null);

  // Exam taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({}); // question_order -> 'A' | 'B' | 'C' | 'D'
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({}); // question_order -> true
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Result state
  const [result, setResult] = useState<ChapterTestResult | null>(null);

  // Review filter
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userAnswersRef = useRef<Record<number, string>>(userAnswers);
  const isSubmittingRef = useRef<boolean>(false);
  const timeRemainingRef = useRef<number>(timeRemainingSeconds);
  const modeRef = useRef<TestMode>(mode);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    loadTestAndQuestions();

    const onFocus = () => {
      if (document.visibilityState === 'visible' && modeRef.current === 'instructions') {
        loadTestAndQuestions({ silent: true });
      }
    };
    const onDataChanged = () => {
      if (modeRef.current === 'instructions') {
        loadTestAndQuestions({ silent: true });
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
    window.addEventListener('storage', onDataChanged);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
      window.removeEventListener('storage', onDataChanged);
    };
  }, [testId, user?.id]);

  const loadTestAndQuestions = async (options?: { silent?: boolean }) => {
    if (!testId) return;
    if (!options?.silent && !test) setLoading(true);
    try {
      const idNum = Number(testId);
      const [testData, qData, prevResult] = await Promise.all([
        fetchChapterTestById(idNum),
        fetchChapterQuestions(idNum),
        fetchLatestChapterStudentResult(idNum, user?.id)
      ]);

      if (testData) {
        setTest(testData);
        setQuestions(qData);
        setTimeRemainingSeconds((testData.duration_minutes || 20) * 60);

        if (prevResult) {
          setExistingResult(prevResult);

          // If Analyse was clicked, directly display the analysis
          if (isAnalyseRequested) {
            setResult(prevResult);
            setUserAnswers(prevResult.answers?.userAnswers || {});
            setMode('result');
            return;
          }
        }

        // If Reattempt was requested, start fresh from instructions
        if (isReattemptRequested) {
          sessionStorage.removeItem(`ec_active_chapter_test_${testId}`);
          setUserAnswers({});
          setMarkedForReview({});
          setResult(null);
          setCurrentIndex(0);
          setMode('instructions');
          return;
        }

        // Check if an active exam session was in progress (e.g. accidental page refresh)
        const storedActive = sessionStorage.getItem(`ec_active_chapter_test_${testId}`);
        if (storedActive && !isAnalyseRequested) {
          try {
            const parsed = JSON.parse(storedActive);
            if (String(parsed.testId) === String(testId) && parsed.timeRemainingSeconds > 0) {
              const restoredAnswers = parsed.userAnswers || {};
              userAnswersRef.current = restoredAnswers;
              setUserAnswers(restoredAnswers);
              setMarkedForReview(parsed.markedForReview || {});
              timeRemainingRef.current = parsed.timeRemainingSeconds;
              setTimeRemainingSeconds(parsed.timeRemainingSeconds);
              setCurrentIndex(parsed.currentIndex || 0);
              setMode('taking');
              return;
            }
          } catch (e) {
            sessionStorage.removeItem(`ec_active_chapter_test_${testId}`);
          }
        }
      }
    } catch (err) {
      console.warn('Error loading chapter test', err);
    } finally {
      setLoading(false);
    }
  };

  // Body class lock & background scroll prevention for full-screen examination mode
  useEffect(() => {
    if (mode === 'taking') {
      document.body.classList.add('exam-mode-active');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('exam-mode-active');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('exam-mode-active');
      document.body.style.overflow = '';
    };
  }, [mode]);

  // Persist active exam state to sessionStorage
  useEffect(() => {
    if (mode === 'taking' && testId && timeRemainingSeconds > 0) {
      const activeData = {
        testId,
        userAnswers,
        markedForReview,
        timeRemainingSeconds,
        currentIndex,
        savedAt: Date.now()
      };
      sessionStorage.setItem(`ec_active_chapter_test_${testId}`, JSON.stringify(activeData));
    }
  }, [mode, testId, userAnswers, markedForReview, timeRemainingSeconds, currentIndex]);

  // Window unload warning while taking exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode === 'taking') {
        e.preventDefault();
        e.returnValue = 'You have an active examination in progress. Are you sure you want to leave?';
        return 'You have an active examination in progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode]);

  // Timer countdown
  useEffect(() => {
    if (mode === 'taking' && timeRemainingSeconds > 0) {
      timeRemainingRef.current = timeRemainingSeconds;
      timerRef.current = setInterval(() => {
        if (timeRemainingRef.current <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          timeRemainingRef.current = 0;
          setTimeRemainingSeconds(0);
          handleTimeUpSubmit();
          return;
        }

        timeRemainingRef.current -= 1;
        setTimeRemainingSeconds(timeRemainingRef.current);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    if (!test || questions.length === 0) return;
    sessionStorage.removeItem(`ec_active_chapter_test_${test.id}`);
    isSubmittingRef.current = false;
    userAnswersRef.current = {};
    const durationSec = (test.duration_minutes || 20) * 60;
    timeRemainingRef.current = durationSec;
    setTimeRemainingSeconds(durationSec);
    setCurrentIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setResult(null);
    setMode('taking');
    // Clear stale URL parameters (?mode=analyse, ?reattempt=true) while preserving sub-category context
    const subParam = searchParams.get('sub');
    if (searchParams.toString()) {
      if (subParam) {
        setSearchParams({ sub: subParam }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  const handleSelectOption = (option: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const next = {
      ...userAnswersRef.current,
      [currentQ.question_order]: option
    };
    userAnswersRef.current = next;
    setUserAnswers(next);
  };

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const next = { ...userAnswersRef.current };
    delete next[currentQ.question_order];
    userAnswersRef.current = next;
    setUserAnswers(next);
  };

  const handleToggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.question_order]: !prev[currentQ.question_order]
    }));
  };

  // Attempted / unattempted counts
  const attemptedCount = Object.keys(userAnswers).length;
  const unattemptedCount = Math.max(0, questions.length - attemptedCount);
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  const getEffectiveAnswers = (): Record<number, string> => {
    if (userAnswersRef.current && Object.keys(userAnswersRef.current).length > 0) {
      return userAnswersRef.current;
    }
    if (userAnswers && Object.keys(userAnswers).length > 0) {
      return userAnswers;
    }
    try {
      const raw = sessionStorage.getItem(`ec_active_chapter_test_${test?.id || testId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.userAnswers && typeof parsed.userAnswers === 'object' && Object.keys(parsed.userAnswers).length > 0) {
          return parsed.userAnswers;
        }
      }
    } catch {}
    return userAnswersRef.current || {};
  };

  const calculateAndSaveResult = async (isAuto = false) => {
    if (!test || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const effectiveAnswers = getEffectiveAnswers();
    const totalQ = questions.length || 1;
    const totalMarks = Number(test.total_marks) || 50;
    const marksPerQ = totalMarks / totalQ;
    const negMark = Number(test.negative_marking) ?? 0.25;

    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      const studentAns = effectiveAnswers[q.question_order];
      if (studentAns) {
        if (studentAns.toUpperCase() === q.correct_option.toUpperCase()) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const unattempted = totalQ - (correct + incorrect);
    const totalNegativeDeduction = Math.round(incorrect * negMark * 100) / 100;
    const rawScore = correct * marksPerQ - totalNegativeDeduction;
    const finalScore = Math.max(0, Math.round(rawScore * 100) / 100);
    const percentage = Math.round((finalScore / totalMarks) * 100);
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    const durationSeconds = (test.duration_minutes || 20) * 60;
    const finalRemainingSeconds = isAuto ? 0 : Math.max(0, timeRemainingSeconds);
    const timeTaken = Math.max(0, durationSeconds - finalRemainingSeconds);

    const storedQuestions: StoredQuestionAnswer[] = questions.map((q) => {
      const order = q.question_order;
      const selected = effectiveAnswers[order] || null;
      const isRight = selected && selected.toUpperCase() === q.correct_option.toUpperCase();
      let status: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
      let marksAwarded = 0;
      if (!selected) {
        status = 'unattempted';
      } else if (isRight) {
        status = 'correct';
        marksAwarded = marksPerQ;
      } else {
        status = 'incorrect';
        marksAwarded = -negMark;
      }

      return {
        questionId: q.id,
        questionOrder: q.question_order,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        selectedOption: selected,
        correctOption: q.correct_option,
        status,
        marksAwarded,
        explanation: q.explanation || null
      };
    });

    const attemptResult: ChapterTestResult = {
      test_id: test.id,
      chapter_id: test.chapter_id,
      user_id: user?.id || 'guest',
      test_title: test.title,
      subject: test.subject,
      score: finalScore,
      total_marks: totalMarks,
      correct_answers: correct,
      incorrect_answers: incorrect,
      unattempted_answers: unattempted,
      accuracy,
      negative_marks: totalNegativeDeduction,
      time_taken_seconds: timeTaken,
      percentage,
      answers: {
        questions: storedQuestions,
        userAnswers: effectiveAnswers
      },
      completed_at: new Date().toISOString()
    };

    // Save and replace latest result in Supabase & Local Cache
    try {
      const saveRes = await saveLatestChapterResult(attemptResult);
      if (saveRes) {
        setExistingResult(saveRes);
      }
    } catch (err) {
      console.warn('Failed to save chapter test result', err);
    }

    sessionStorage.removeItem(`ec_active_chapter_test_${test.id}`);
    setUserAnswers(effectiveAnswers);
    setResult(attemptResult);
    setShowSubmitModal(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setMode('result');
  };

  const calculateAndSaveResultRef = useRef(calculateAndSaveResult);
  useEffect(() => {
    calculateAndSaveResultRef.current = calculateAndSaveResult;
  });

  const handleTimeUpSubmit = () => {
    if (calculateAndSaveResultRef.current) {
      calculateAndSaveResultRef.current(true);
    } else {
      calculateAndSaveResult(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-[#F4F8FF] md:bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading Chapter Wise Test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen p-8 bg-[#F4F8FF] md:bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-lg border border-slate-100">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Test Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested test could not be located or has been unpublished.
          </p>
          <Link
            to="/tests/chapter-wise"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl"
          >
            Back to Chapter Wise Tests
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const marksPerQ = ((test.total_marks || 50) / (questions.length || 1)).toFixed(2);
  const subjectSlug = getSubjectByName(test.subject)?.slug || encodeURIComponent(test.subject.toLowerCase().replace(/\s+/g, '-'));
  const subParam = searchParams.get('sub');
  const availableTestsUrl = test.chapter_id
    ? `/tests/chapter-wise/${subjectSlug}/${test.chapter_id}${subParam ? `?sub=${encodeURIComponent(subParam)}` : ''}`
    : `/tests/chapter-wise/${subjectSlug}${subParam ? `?sub=${encodeURIComponent(subParam)}` : ''}`;

  // ==========================================
  // VIEW 1: INSTRUCTIONS SCREEN
  // ==========================================
  if (mode === 'instructions') {
    return (
      <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
        <div className="bg-white border-b border-[#E2ECFF] md:border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <BackButton to={availableTestsUrl} forceFallback label="Available Tests" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 sm:p-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 mb-3">
                {test.subject} Chapter Test
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                {test.title}
              </h1>
              <p className="text-xs sm:text-sm text-purple-100 mt-1">
                Read all instructions carefully before beginning the examination.
              </p>
            </div>

            {/* Test Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-center">
              <div className="p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Questions</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{questions.length}</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duration</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{test.duration_minutes} Mins</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Marks</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{test.total_marks}</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Negative Mark</p>
                <p className="text-lg font-extrabold text-rose-600 mt-0.5">-{test.negative_marking}</p>
              </div>
            </div>

            {/* Rules and Guidelines */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Exam Guidelines & Marking Scheme
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed list-disc list-inside">
                  <li>This test contains <strong>{questions.length} objective questions</strong>, each having four options (A, B, C, D) with only one correct choice.</li>
                  <li>Every correct answer awards <strong>+{marksPerQ} marks</strong>.</li>
                  <li>Every incorrect answer incurs a penalty deduction of <strong>-{test.negative_marking} marks</strong>.</li>
                  <li>Unattempted questions carry zero marks (no deduction).</li>
                  <li>The live countdown timer will start immediately once you click <strong>Start Test</strong>.</li>
                  <li>You may freely navigate between questions, change your selected answers, or mark questions for review using the Question Palette.</li>
                  <li>When the timer expires, your test will automatically be submitted.</li>
                </ul>
              </div>

              {/* Palette Legend Preview */}
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2.5">
                  Question Palette Indicator Legend
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                    <span className="text-slate-700">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                    <span className="text-slate-700">Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">3</span>
                    <span className="text-slate-700">Not Attempted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-white border-2 border-blue-600 text-blue-600 font-bold text-[10px] flex items-center justify-center">4</span>
                    <span className="text-slate-700">Current Question</span>
                  </div>
                </div>
              </div>

              {/* Previous Completed Result Banner if present */}
              {existingResult && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      <Award className="w-3 h-3" />
                      Previous Completion Found
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-purple-950 mt-1">
                      Latest Score: {existingResult.score} / {existingResult.total_marks} ({existingResult.percentage ?? (existingResult.total_marks > 0 ? Math.round((existingResult.score / existingResult.total_marks) * 100) : 0)}%) • Accuracy: {existingResult.accuracy}%
                    </p>
                    <p className="text-[11px] text-purple-700">
                      Submitting a new attempt will update your latest result.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(existingResult);
                        setUserAnswers(existingResult.answers?.userAnswers || {});
                        setMode('result');
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-purple-300 hover:bg-purple-100 text-purple-700 font-bold text-xs shadow-2xs transition-colors"
                    >
                      View Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  By clicking {existingResult ? 'Start Reattempt' : 'Start Test'}, you agree to take the assessment under timed conditions.
                </p>
                <button
                  type="button"
                  onClick={handleStartTest}
                  disabled={questions.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {existingResult ? 'Start Reattempt' : 'Start Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE TEST TAKING SCREEN
  // ==========================================
  if (mode === 'taking' && currentQ) {
    const isAnswered = Boolean(userAnswers[currentQ.question_order]);
    const isMarked = Boolean(markedForReview[currentQ.question_order]);
    const isWarningTime = timeRemainingSeconds <= 300 && timeRemainingSeconds > 60; // 5m to 1m (desktop warning)
    const isCriticalTime = timeRemainingSeconds <= 60; // <= 1m (desktop critical)
    const isMobileWarningTime = timeRemainingSeconds <= 120; // under 2 minutes (mobile preserved)

    return (
      <div className="min-h-screen select-none">
        {/* ============================================================== */}
        {/* MOBILE DEDICATED EXAM INTERFACE (md:hidden)                     */}
        {/* ============================================================== */}
        <div className="md:hidden flex flex-col h-[100dvh] bg-[#F4F8FF] overflow-hidden">
          {/* 1. Mobile Exam Top Bar (Compact Header) */}
          <div className="shrink-0 bg-[#0C122A] text-white border-b border-[#1E2756] px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs z-30">
            {/* Left: Exit/Back + Title */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setShowExitModal(true)}
                className="p-1.5 rounded-lg bg-[#151D42] text-slate-300 hover:text-white border border-[#222E64] active:scale-95 transition-transform shrink-0"
                aria-label="Exit Exam"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-white truncate leading-tight">
                  {test.title || 'Chapter Wise Test'}
                </h2>
                <p className="text-[10px] text-slate-400 truncate">
                  Chapter Wise Test
                </p>
              </div>
            </div>

            {/* Center: Question Progress */}
            <div className="shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-[#151D42] text-blue-300 border border-[#222E64] text-[11px] font-extrabold tracking-wide">
                Q {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Right: Countdown Timer */}
            <div className="shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-extrabold border transition-colors ${
                  isMobileWarningTime
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
                    : 'bg-[#151D42] text-white border-[#222E64]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isMobileWarningTime ? 'text-rose-400' : 'text-blue-400'}`} />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            </div>
          </div>

          {/* 2. Mobile Test Information Row */}
          <div className="shrink-0 bg-white border-b border-slate-200/80 px-3.5 py-2 flex items-center justify-between text-xs shadow-2xs z-20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {test.subject}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                <span className="text-emerald-600">+{marksPerQ}</span> / <span className="text-rose-500">-{test.negative_marking}</span>
              </span>
            </div>

            {/* Questions Palette Trigger Button */}
            <button
              type="button"
              onClick={() => setShowPaletteDrawer(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0C122A] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Questions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] text-white ml-0.5">
                {attemptedCount}/{questions.length}
              </span>
            </button>
          </div>

          {/* 3. Mobile Question & Options Workspace (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
            {/* Question Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  Q{currentIndex + 1}
                </span>
                {isMarked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Bookmark className="w-3 h-3 text-amber-600 fill-amber-600" />
                    Marked for Review
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="text-[15px] font-semibold text-slate-900 leading-relaxed whitespace-pre-line tracking-normal">
                {currentQ.question_text}
              </div>

              {/* Optional Question Image */}
              {currentQ.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-56">
                  <img
                    src={currentQ.image_url}
                    alt={`Question ${currentIndex + 1}`}
                    className="w-full h-auto object-contain max-h-56"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {[
                { key: 'A', text: currentQ.option_a },
                { key: 'B', text: currentQ.option_b },
                { key: 'C', text: currentQ.option_c },
                { key: 'D', text: currentQ.option_d },
              ].map((opt) => {
                const isSelected = userAnswers[currentQ.question_order] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none active:scale-[0.99] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span
                      className={`text-[13px] sm:text-sm pt-0.5 leading-relaxed break-words flex-1 ${
                        isSelected ? 'font-bold text-blue-950' : 'text-slate-800'
                      }`}
                    >
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Mobile Bottom Exam Control Bar (Fixed) */}
          <div className="shrink-0 bg-white border-t border-slate-200/90 px-3.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-2 z-30">
            {/* Left: Previous */}
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 active:scale-95 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Center: Mark for Review & Clear Response */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                className={`h-10 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 active:scale-95 ${
                  isMarked
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600 text-amber-600' : 'text-slate-500'}`} />
                <span>{isMarked ? 'Marked' : 'Review'}</span>
              </button>

              {isAnswered && (
                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="h-10 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right: Save & Next (or Submit Test) */}
            <button
              type="button"
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  setShowSubmitModal(true);
                }
              }}
              className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-colors flex items-center gap-1 active:scale-95 shrink-0 ${
                currentIndex < questions.length - 1
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              <span>{currentIndex < questions.length - 1 ? 'Save & Next' : 'Submit Test'}</span>
              {currentIndex < questions.length - 1 ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <Send className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* DESKTOP EXAM INTERFACE (hidden md:flex flex-col min-h-screen)  */}
        {/* ============================================================== */}
        <div className="hidden md:flex flex-col min-h-screen bg-slate-100">
          {/* Sticky Exam Top Bar */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
              {/* TOP-LEFT: Back arrow + Subject badge + Test Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
                  aria-label="Exit examination"
                  title="Leave Examination"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
                      {test.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">· Chapter Wise Test</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md sm:max-w-xl mt-0.5 leading-snug">
                    {test.title}
                  </h2>
                </div>
              </div>

              {/* TOP-RIGHT: Fullscreen button + Timer + Submit Test */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                  title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </>
                  )}
                </button>

                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-extrabold border transition-colors ${
                    isCriticalTime
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : isWarningTime
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 ${
                      isCriticalTime ? 'text-rose-600' : isWarningTime ? 'text-amber-600' : 'text-purple-600'
                    }`}
                  />
                  <span>{formatTime(timeRemainingSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Test</span>
                </button>
              </div>
            </div>
          </header>

          {/* Status Bar with Progress Indicator */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs gap-4 flex-wrap">
              <div className="flex items-center gap-4 sm:gap-6 font-semibold">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                  Attempted: <strong>{attemptedCount}</strong>
                </span>
                <span className="text-purple-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                  Marked: <strong>{markedCount}</strong>
                </span>
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                  Unattempted: <strong>{unattemptedCount}</strong>
                </span>
              </div>

              {/* Visual Progress Indicator */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <span className="font-bold text-slate-900">{attemptedCount}</span>
                  <span className="text-slate-400"> / </span>
                  <span>{questions.length} Answered</span>
                </div>
                <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-200 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{
                      width: `${questions.length > 0 ? (attemptedCount / questions.length) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 min-w-[32px] text-right">
                  {questions.length > 0 ? Math.round((attemptedCount / questions.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Main Test Layout (Question + Question Palette) */}
          <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Question Panel (9 cols on desktop: wider, primary focus) */}
            <div className="lg:col-span-9 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 lg:p-8 min-h-[580px] lg:min-h-[620px]">
              {/* Question Header */}
              <div className="shrink-0 flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      Question {currentIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      of {questions.length}
                    </span>
                  </div>
                  {isMarked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                      <Bookmark className="w-3 h-3 fill-purple-600 text-purple-600" />
                      Marked for Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/60">
                  <span className="text-slate-600 font-semibold">Marks:</span>
                  <span className="text-emerald-700 font-bold">+{marksPerQ}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-600 font-bold">-{test.negative_marking}</span>
                </div>
              </div>

              {/* Question Content Area (Flex-1 to absorb vertical space and stabilize height) */}
              <div className="flex-1 flex flex-col justify-start">
                {/* Question Text */}
                <div className="text-[15px] sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line mb-5 tracking-normal select-text">
                  {currentQ.question_text}
                </div>

                {/* Optional Question Image */}
                {currentQ.image_url && (
                  <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 max-h-72 shrink-0">
                    <img
                      src={currentQ.image_url}
                      alt={`Question ${currentIndex + 1}`}
                      className="w-full h-auto object-contain max-h-72"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Four Options */}
                <div className="space-y-2.5 sm:space-y-3">
                  {[
                    { key: 'A', text: currentQ.option_a },
                    { key: 'B', text: currentQ.option_b },
                    { key: 'C', text: currentQ.option_c },
                    { key: 'D', text: currentQ.option_d },
                  ].map((opt) => {
                    const isSelected = userAnswers[currentQ.question_order] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 cursor-pointer select-none group min-h-[54px] ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50/90 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-purple-50 group-hover:text-purple-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className={`text-xs sm:text-sm pt-0.5 leading-relaxed break-words flex-1 select-text ${isSelected ? 'font-bold text-purple-950' : 'text-slate-800'}`}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions Bar (Firmly pinned to consistent bottom position) */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMarkForReview}
                    className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                      isMarked
                        ? 'bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-purple-600 text-purple-600' : 'text-slate-500'}`} />
                    <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                  </button>

                  {isAnswered && (
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                    >
                      Clear Response
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentIndex < questions.length - 1) {
                        setCurrentIndex((prev) => prev + 1);
                      } else {
                        setShowSubmitModal(true);
                      }
                    }}
                    className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
                      currentIndex < questions.length - 1
                        ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    }`}
                  >
                    <span>{currentIndex < questions.length - 1 ? 'Save & Next' : 'Submit Test'}</span>
                    {currentIndex < questions.length - 1 ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Question Palette (Desktop: 3 cols, compact & secondary) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sticky top-24">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Question Palette</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {questions.length} Questions
                  </span>
                </div>

                {/* Grid of question numbers with subtle polished scrollbar */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-h-[350px] overflow-y-auto p-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                  {questions.map((q, idx) => {
                    const answered = Boolean(userAnswers[q.question_order]);
                    const marked = Boolean(markedForReview[q.question_order]);
                    const isCurrent = idx === currentIndex;

                    let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/80';
                    if (marked && answered) {
                      // Combined: Answered + Marked for Review
                      btnStyle = 'bg-purple-600 text-white font-bold ring-2 ring-emerald-500 shadow-2xs';
                    } else if (marked) {
                      // Marked for Review only
                      btnStyle = 'bg-purple-600 text-white font-bold shadow-2xs hover:bg-purple-700';
                    } else if (answered) {
                      // Answered only
                      btnStyle = 'bg-emerald-600 text-white font-bold shadow-2xs hover:bg-emerald-700';
                    }

                    return (
                      <button
                        key={q.question_order}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-8 sm:h-8.5 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ${btnStyle} ${
                          isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 z-10 scale-105 font-black' : ''
                        }`}
                      >
                        {idx + 1}
                        {marked && answered && (
                          <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-xs"
                            title="Answered & Marked for Review"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Legend in Palette */}
              <div className="pt-3.5 border-t border-slate-100 mt-3.5">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-emerald-600 shrink-0"></span>
                    <span className="truncate">Answered ({attemptedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-purple-600 shrink-0"></span>
                    <span className="truncate">Marked ({markedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-purple-600 ring-1 ring-emerald-500 shrink-0 relative">
                      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-emerald-400"></span>
                    </span>
                    <span className="truncate">Ans & Marked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-slate-100 border border-slate-300 shrink-0"></span>
                    <span className="truncate">Unanswered ({unattemptedCount})</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 pt-0.5">
                    <span className="w-2.5 h-2.5 rounded-md ring-2 ring-blue-600 bg-white shrink-0"></span>
                    <span>Current Question</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE QUESTION PALETTE DRAWER (Bottom Sheet)                  */}
        {/* ============================================================== */}
        {showPaletteDrawer && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div
              className="flex-1"
              onClick={() => setShowPaletteDrawer(false)}
            />
            <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Question Palette
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Tap any question number to navigate directly
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaletteDrawer(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>Answered ({attemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Review ({markedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Unanswered ({unattemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-blue-600 bg-white"></span>
                  <span>Current (Q{currentIndex + 1})</span>
                </div>
              </div>

              {/* Number Grid */}
              <div className="p-4 overflow-y-auto max-h-[42vh] grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const answered = Boolean(userAnswers[q.question_order]);
                  const marked = Boolean(markedForReview[q.question_order]);
                  const isCurrent = idx === currentIndex;

                  let btnClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (marked) {
                    btnClass = 'bg-amber-500 text-white font-bold border-amber-600';
                  } else if (answered) {
                    btnClass = 'bg-emerald-600 text-white font-bold border-emerald-700';
                  }

                  return (
                    <button
                      key={q.question_order}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPaletteDrawer(false);
                      }}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all relative flex items-center justify-center active:scale-95 ${btnClass} ${
                        isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-xs' : ''
                      }`}
                    >
                      {idx + 1}
                      {marked && answered && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Bottom Action */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setShowPaletteDrawer(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
                >
                  Close Palette
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaletteDrawer(false);
                    setShowSubmitModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MOBILE EXIT CONFIRMATION MODAL                                 */}
        {/* ============================================================== */}
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Leave Examination?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Your test session is in progress. Your answers will remain saved in this browser, but the examination timer will continue running.
              </p>
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  Stay in Exam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    navigate(availableTestsUrl);
                  }}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                >
                  Exit Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBMIT CONFIRMATION MODAL (Both Mobile & Desktop)              */}
        {/* ============================================================== */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Submit Test?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please review your exam progress summary before submitting.
              </p>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-2 py-4 my-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Attempted</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">{attemptedCount}</p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Unattempted</p>
                  <p className="text-base font-extrabold text-slate-700 mt-0.5">{unattemptedCount}</p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Marked</p>
                  <p className="text-base font-extrabold text-amber-600 mt-0.5">{markedCount}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to submit? Once submitted, you cannot change your answers.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => calculateAndSaveResult(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: RESULT SCREEN
  // ==========================================
  if (mode === 'result' && result) {
    const isPass = (result.percentage ?? 0) >= 40;

    return (
      <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
        <div className="bg-white border-b border-[#E2ECFF] md:border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
            <BackButton to={availableTestsUrl} forceFallback label="Available Tests" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Score Banner */}
            <div className={`p-8 text-center text-white ${isPass ? 'bg-gradient-to-r from-purple-700 to-indigo-800' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-xs">
                <Award className="w-9 h-9 text-white" />
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-purple-100 border border-white/30 mb-2">
                {result.subject || test.subject} Chapter Assessment
              </span>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {result.test_title || test.title}
              </h1>

              {/* Score Display */}
              <div className="my-6">
                <p className="text-xs uppercase tracking-wider text-purple-200 font-bold">Your Score</p>
                <div className="text-4xl sm:text-5xl font-black mt-1">
                  {result.score} <span className="text-xl font-normal text-purple-200">/ {result.total_marks}</span>
                </div>
                <p className="text-sm font-semibold text-purple-200 mt-1">
                  Percentage: {result.percentage}% • Accuracy: {result.accuracy}%
                </p>
              </div>
            </div>

            {/* Performance Metrics Grid */}
            <div className="p-6 sm:p-8">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Detailed Performance Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">Correct</p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{result.correct_answers}</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                  <XCircle className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-rose-800 uppercase">Incorrect</p>
                  <p className="text-xl font-extrabold text-rose-700 mt-0.5">{result.incorrect_answers}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                  <HelpCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-slate-600 uppercase">Unattempted</p>
                  <p className="text-xl font-extrabold text-slate-700 mt-0.5">{result.unattempted_answers}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                  <Percent className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-amber-800 uppercase">Negative Marks</p>
                  <p className="text-xl font-extrabold text-amber-700 mt-0.5">
                    -{result.negative_marks !== undefined ? result.negative_marks : (result.incorrect_answers * (Number(test.negative_marking) || 0.25)).toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center col-span-2 sm:col-span-1">
                  <Timer className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-indigo-800 uppercase">Time Taken</p>
                  <p className="text-base font-extrabold text-indigo-900 mt-0.5">
                    {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('review')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review Answers with Solutions</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartTest}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reattempt Test</span>
                </button>

                <Link
                  to={availableTestsUrl}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold text-center transition-colors"
                >
                  Back to Available Tests
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: ANSWER REVIEW SCREEN
  // ==========================================
  if (mode === 'review' && result) {
    const reviewMarksPerQ = questions.length > 0 ? (Number(result.total_marks) / questions.length).toFixed(2) : '1.00';
    const reviewNegMark = test.negative_marking;

    const filteredQuestions = questions.filter((q) => {
      const studentAns = userAnswers[q.question_order];
      const isCorrect = studentAns && studentAns.toUpperCase() === q.correct_option.toUpperCase();
      const isAttempted = Boolean(studentAns);

      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'incorrect') return isAttempted && !isCorrect;
      if (reviewFilter === 'unattempted') return !isAttempted;
      return true;
    });

    return (
      <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#E2ECFF] md:border-slate-200 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('result')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Result</span>
              </button>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Answer Review: {result.test_title || test.title}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Score: {result.score}/{result.total_marks} • {result.correct_answers} Correct, {result.incorrect_answers} Incorrect
                </p>
              </div>
            </div>

            <Link
              to={availableTestsUrl}
              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
            >
              Finish Review
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              {[
                { key: 'all', label: `All (${questions.length})` },
                { key: 'correct', label: `Correct (${result.correct_answers})` },
                { key: 'incorrect', label: `Incorrect (${result.incorrect_answers})` },
                { key: 'unattempted', label: `Unattempted (${result.unattempted_answers})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReviewFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    reviewFilter === tab.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {filteredQuestions.map((q) => {
            const studentAns = userAnswers[q.question_order];
            const isCorrect = studentAns && studentAns.toUpperCase() === q.correct_option.toUpperCase();
            const isAttempted = Boolean(studentAns);

            return (
              <div
                key={q.question_order}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8"
              >
                {/* Top Question Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                    Question {q.question_order} of {questions.length}
                  </span>

                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Correct (+{reviewMarksPerQ})
                    </span>
                  ) : isAttempted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      <X className="w-3.5 h-3.5 text-rose-700" />
                      Incorrect (-{reviewNegMark})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      Unattempted (0.0)
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line mb-5">
                  {q.question_text}
                </p>

                {/* Options Review */}
                <div className="space-y-2.5">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d },
                  ].map((opt) => {
                    const isRightOption = opt.key.toUpperCase() === q.correct_option.toUpperCase();
                    const isChosenByStudent = studentAns === opt.key;

                    let rowStyle = 'border-slate-200 bg-white text-slate-800';
                    let badgeStyle = 'bg-slate-100 text-slate-700';

                    if (isRightOption) {
                      rowStyle = 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-950 ring-1 ring-emerald-500';
                      badgeStyle = 'bg-emerald-600 text-white';
                    } else if (isChosenByStudent && !isRightOption) {
                      rowStyle = 'border-rose-400 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-400';
                      badgeStyle = 'bg-rose-600 text-white';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-2xl border-2 flex items-start justify-between gap-3 text-xs sm:text-sm ${rowStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeStyle}`}>
                            {opt.key}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                        </div>

                        <div className="shrink-0 text-right">
                          {isRightOption && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-2 py-0.5 bg-emerald-100 rounded">
                              Correct Answer
                            </span>
                          )}
                          {isChosenByStudent && !isRightOption && (
                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider px-2 py-0.5 bg-rose-100 rounded">
                              Your Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      Explanation / व्याख्या:
                    </p>
                    <p className="whitespace-pre-line text-slate-700">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                No questions found under the "{reviewFilter}" filter.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
