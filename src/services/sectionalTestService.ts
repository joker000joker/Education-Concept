import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SectionalTest,
  SectionalQuestion,
  SectionalSubject,
  TestAttemptResult,
  SectionalTestResult,
  StoredQuestionAnswer
} from '../types';

export const SECTIONAL_SUBJECTS: SectionalSubject[] = [
  'Mathematics',
  'Reasoning',
  'English',
  'Hindi',
  'Current Affairs',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Physics',
  'Chemistry',
  'Biology',
];

const LOCAL_STORAGE_TESTS_KEY = 'ec_sectional_tests_cache_v1';
const LOCAL_STORAGE_QUESTIONS_KEY = 'ec_sectional_questions_cache_v1';
const LOCAL_STORAGE_ATTEMPTS_KEY = 'ec_test_attempts_v1';

// No initial demo tests or sample fallback data. Empty test lists remain empty.
const INITIAL_DEMO_TESTS: SectionalTest[] = [];

const INITIAL_DEMO_QUESTIONS: Record<number, SectionalQuestion[]> = {};

// Local storage helpers
const POSSIBLE_TEST_KEYS = [
  LOCAL_STORAGE_TESTS_KEY,
  'ec_sectional_tests_v1',
  'ec_sectional_tests_cache_v1',
  'ec_sectional_tests_cache',
  'ec_sectional_tests',
  'sectional_tests',
  'ec_tests',
  'ec_tests_v1',
  'ec_tests_cache',
  'tests'
];

const POSSIBLE_QUESTION_KEYS = [
  LOCAL_STORAGE_QUESTIONS_KEY,
  'ec_sectional_questions_v1',
  'ec_sectional_questions_cache_v1',
  'ec_sectional_questions_cache',
  'ec_sectional_questions',
  'sectional_questions',
  'ec_questions',
  'questions'
];

function getLocalTests(): SectionalTest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          id: Number(item.id),
          title: String(item.title || ''),
          subject: (item.subject || 'Mathematics') as SectionalSubject,
          total_questions: Number(item.total_questions || 0),
          total_marks: Number(item.total_marks || 50),
          duration_minutes: Number(item.duration_minutes || 20),
          negative_marking: Number(item.negative_marking ?? 0.25),
          published: item.published !== undefined ? Boolean(item.published) : true,
          sort_order: item.sort_order !== undefined && item.sort_order !== null ? Number(item.sort_order) : undefined,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        })).sort((a, b) => {
          const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : Infinity;
          const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : Infinity;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
      }
    }

    // One-time fallback check for legacy keys if primary is empty
    for (const key of POSSIBLE_TEST_KEYS) {
      if (key === LOCAL_STORAGE_TESTS_KEY) continue;
      const legacyRaw = localStorage.getItem(key);
      if (!legacyRaw) continue;
      try {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((item) => item && item.title);
          if (valid.length > 0) {
            setLocalTests(valid as SectionalTest[]);
            return valid as SectionalTest[];
          }
        }
      } catch {}
    }

    return [];
  } catch (err) {
    return [];
  }
}

function setLocalTests(tests: SectionalTest[]): void {
  try {
    const serialized = JSON.stringify(tests);
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, serialized);
    // Clean up legacy variant keys so deleted tests are never resurrected
    for (const key of POSSIBLE_TEST_KEYS) {
      if (key !== LOCAL_STORAGE_TESTS_KEY) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Failed to save tests to localStorage', err);
  }
}

function getLocalQuestions(testId: number): SectionalQuestion[] {
  try {
    const numId = Number(testId);
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && (map[numId] || map[String(numId)])) {
        const list = map[numId] || map[String(numId)];
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    }

    // Check individual question key
    const singleRaw = localStorage.getItem(`ec_sectional_questions_${numId}`);
    if (singleRaw) {
      const list = JSON.parse(singleRaw);
      if (Array.isArray(list) && list.length > 0) return list;
    }

    return INITIAL_DEMO_QUESTIONS[numId] || [];
  } catch (err) {
    return INITIAL_DEMO_QUESTIONS[Number(testId)] || [];
  }
}

function setLocalQuestions(testId: number, questions: SectionalQuestion[]): void {
  try {
    const numId = Number(testId);
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    const map = raw ? JSON.parse(raw) : { ...INITIAL_DEMO_QUESTIONS };
    map[numId] = questions;
    const serialized = JSON.stringify(map);
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, serialized);
    localStorage.setItem(`ec_sectional_questions_${numId}`, JSON.stringify(questions));
  } catch (err) {
    console.warn('Failed to save questions to localStorage', err);
  }
}

function removeLocalTest(testId: number): void {
  const tests = getLocalTests().filter((t) => Number(t.id) !== Number(testId));
  setLocalTests(tests);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[testId];
      delete map[String(testId)];
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(map));
    }
    localStorage.removeItem(`ec_sectional_questions_${testId}`);
    for (const key of POSSIBLE_QUESTION_KEYS) {
      if (key !== LOCAL_STORAGE_QUESTIONS_KEY) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

let isSyncing = false;

/**
 * Safely merge server tests into local cache without wiping out other subjects
 */
function mergeServerTestsIntoLocal(serverTests: SectionalTest[]): void {
  try {
    const current = getLocalTests();
    const map = new Map<number, SectionalTest>();
    for (const t of current) {
      map.set(Number(t.id), t);
    }
    for (const t of serverTests) {
      map.set(Number(t.id), t);
    }
    setLocalTests(Array.from(map.values()));
  } catch {}
}

/**
 * Automatically synchronizes with shared server database:
 * Refreshes local cache from the authoritative server so mobile and laptop stay 100% in sync.
 */
export async function syncLocalTestsWithServer(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    // 1. Fetch fresh authoritative tests from shared server
    const res = await fetch(`/api/sectional-tests?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const serverTests = await res.json();
      if (Array.isArray(serverTests)) {
        setLocalTests(serverTests);
      }
    }
  } catch (err) {
    console.info('[SectionalTest] Background sync notice:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Fetch sectional tests from the shared backend API with automatic cross-device freshness.
 * Both Mobile and Desktop use this same unified authoritative source of truth.
 */
export async function fetchSectionalTests(options?: {
  subject?: string;
  publishedOnly?: boolean;
}): Promise<SectionalTest[]> {
  // 1. Primary: Fetch from Shared Server Backend API (authoritative source)
  try {
    const params = new URLSearchParams();
    if (options?.publishedOnly) params.append('publishedOnly', 'true');
    if (options?.subject && options.subject !== 'All') params.append('subject', options.subject);
    params.append('_t', String(Date.now())); // Bypass browser and intermediary cache

    const response = await fetch(`/api/sectional-tests?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (response.ok) {
      const serverTests = await response.json();
      if (Array.isArray(serverTests)) {
        if (!options?.subject || options.subject === 'All') {
          // If fetching without subject filter, authoritatively update local cache
          setLocalTests(serverTests);
        } else {
          // If subject-filtered, merge into local cache rather than wiping out other subjects
          mergeServerTestsIntoLocal(serverTests);
        }
        return serverTests;
      }
    }
  } catch (err) {
    console.info('[SectionalTest] Server fetch notice, checking local cache:', err);
  }

  // 2. Cloud Fallback: Check Supabase if configured and table exists
  let supabaseTests: SectionalTest[] = [];
  let fetchedFromSupabase = false;
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('sectional_tests').select('*');
      if (options?.publishedOnly) {
        query = query.eq('published', true);
      }
      if (options?.subject && options.subject !== 'All') {
        query = query.ilike('subject', options.subject);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        supabaseTests = data.map((row: any) => ({
          id: Number(row.id),
          title: String(row.title || ''),
          subject: (row.subject || 'General Knowledge') as SectionalSubject,
          total_questions: Number(row.total_questions || 0),
          total_marks: Number(row.total_marks || 50),
          duration_minutes: Number(row.duration_minutes || 20),
          negative_marking: Number(row.negative_marking ?? 0.25),
          published: Boolean(row.published),
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
        fetchedFromSupabase = true;
      }
    } catch {}
  }

  if (fetchedFromSupabase && supabaseTests.length > 0) {
    return supabaseTests;
  }

  // 3. Device Cache Fallback
  let local = getLocalTests();
  if (options?.publishedOnly) {
    local = local.filter((t) => t.published !== false);
  }
  if (options?.subject && options.subject !== 'All') {
    const target = (options.subject || '').toLowerCase().trim();
    local = local.filter(
      (t) => (t.subject || '').toLowerCase().trim() === target
    );
  }
  return local;
}

/**
 * Fetch a single test by ID
 */
export async function fetchSectionalTestById(
  id: number | string
): Promise<SectionalTest | null> {
  const numId = Number(id);

  // 1. Primary: Server API
  try {
    const res = await fetch(`/api/sectional-tests/${numId}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) return data as SectionalTest;
    }
  } catch {}

  // 2. Cloud Fallback: Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('sectional_tests')
        .select('*')
        .eq('id', numId)
        .single();
      if (!error && data) {
        return data as SectionalTest;
      }
    } catch {}
  }

  // 3. Local Cache
  const local = getLocalTests();
  return local.find((t) => Number(t.id) === numId) || null;
}

/**
 * Fetch questions for a test
 */
export async function fetchSectionalQuestions(
  testId: number | string
): Promise<SectionalQuestion[]> {
  const numId = Number(testId);

  // 1. Primary: Server API
  try {
    const res = await fetch(`/api/sectional-tests/${numId}/questions?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocalQuestions(numId, data);
        return data as SectionalQuestion[];
      }
    }
  } catch {}

  // 2. Cloud Fallback: Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('sectional_questions')
        .select('*')
        .eq('test_id', numId)
        .order('question_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as SectionalQuestion[];
      }
    } catch {}
  }

  // 3. Local Cache
  return getLocalQuestions(numId);
}

/**
 * Create or update a sectional test and its questions.
 * Immediately saves to the shared backend so Mobile and Desktop stay 100% in sync.
 * Strict rule: A test must NEVER exist only in local browser cache and be considered saved.
 */
export async function saveSectionalTest(
  testData: Partial<SectionalTest>,
  questions: SectionalQuestion[]
): Promise<{ success: boolean; testId: number; error?: string }> {
  const totalQuestions = questions.length;
  const targetId = testData.id ? Number(testData.id) : Date.now();

  const payloadTest: SectionalTest = {
    id: targetId,
    title: String(testData.title || 'Untitled Test').trim(),
    subject: (testData.subject || 'Mathematics') as SectionalSubject,
    total_questions: totalQuestions,
    total_marks: Number(testData.total_marks) || 50,
    duration_minutes: Number(testData.duration_minutes) || 20,
    negative_marking: Number(testData.negative_marking ?? 0.25),
    published: testData.published !== undefined ? Boolean(testData.published) : true,
    sort_order: testData.sort_order !== undefined && testData.sort_order !== null ? Number(testData.sort_order) : undefined,
    created_at: testData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Primary: Save to Shared Server API (MANDATORY PERSISTENCE)
  let savedTest: SectionalTest = payloadTest;
  let savedQuestions: SectionalQuestion[] = questions;

  const res = await fetch('/api/sectional-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify({ test: payloadTest, questions })
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Server save failed (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  const data = await res.json();
  if (!data || !data.success || !data.test) {
    throw new Error(data?.error || 'Shared backend did not confirm test creation');
  }

  savedTest = data.test;
  if (Array.isArray(data.questions)) {
    savedQuestions = data.questions;
  }

  // 2. Authoritatively update local cache on the current device
  updateLocalTest(savedTest, savedQuestions);

  // 3. Mirror to Supabase if configured and table exists
  if (isSupabaseConfigured) {
    try {
      const isEditing = Boolean(testData.id);
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('sectional_tests')
          .update({
            title: savedTest.title,
            subject: savedTest.subject,
            total_questions: totalQuestions,
            total_marks: savedTest.total_marks,
            duration_minutes: savedTest.duration_minutes,
            negative_marking: savedTest.negative_marking,
            published: savedTest.published,
            updated_at: new Date().toISOString()
          })
          .eq('id', savedTest.id);

        if (!updateError) {
          await supabase.from('sectional_questions').delete().eq('test_id', savedTest.id);
          const questionsPayload = savedQuestions.map((q, idx) => ({
            test_id: savedTest.id,
            question_order: idx + 1,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            explanation: q.explanation || null
          }));
          await supabase.from('sectional_questions').insert(questionsPayload);
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('sectional_tests')
          .insert({
            title: savedTest.title,
            subject: savedTest.subject,
            total_questions: totalQuestions,
            total_marks: savedTest.total_marks,
            duration_minutes: savedTest.duration_minutes,
            negative_marking: savedTest.negative_marking,
            published: savedTest.published
          })
          .select()
          .single();

        if (!insertError && inserted) {
          const newId = inserted.id;
          const questionsPayload = savedQuestions.map((q, idx) => ({
            test_id: newId,
            question_order: idx + 1,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            explanation: q.explanation || null
          }));
          await supabase.from('sectional_questions').insert(questionsPayload);
        }
      }
    } catch {}
  }

  return { success: true, testId: savedTest.id };
}

function updateLocalTest(test: SectionalTest, questions: SectionalQuestion[]) {
  const current = getLocalTests();
  const existingIdx = current.findIndex((t) => Number(t.id) === Number(test.id));
  if (existingIdx >= 0) {
    current[existingIdx] = test;
  } else {
    current.unshift(test);
  }
  setLocalTests(current);
  setLocalQuestions(test.id, questions);
}

/**
 * Delete a sectional test from the shared persistent backend and local cache.
 */
export async function deleteSectionalTest(id: number): Promise<{ success: boolean; error?: string }> {
  // 1. Primary: Server API (Authoritative)
  const res = await fetch(`/api/sectional-tests/${id}`, {
    method: 'DELETE',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to delete test from server (${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) msg = parsed.error;
    } catch {}
    throw new Error(msg);
  }

  // 2. Cloud Fallback: Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from('sectional_tests').delete().eq('id', id);
    } catch {}
  }

  // 3. Local Cache
  removeLocalTest(id);
  return { success: true };
}

/**
 * Toggle published state in the shared persistent backend and local cache.
 */
export async function togglePublishSectionalTest(
  id: number,
  published: boolean
): Promise<{ success: boolean; error?: string }> {
  // 1. Primary: Server API (Authoritative)
  const res = await fetch(`/api/sectional-tests/${id}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify({ published })
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to update status on server (${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) msg = parsed.error;
    } catch {}
    throw new Error(msg);
  }

  // 2. Cloud Fallback: Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('sectional_tests')
        .update({ published, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {}
  }

  // 3. Local Cache
  const tests = getLocalTests().map((t) => (Number(t.id) === Number(id) ? { ...t, published } : t));
  setLocalTests(tests);
  return { success: true };
}

/**
 * Persistently reorder sectional tests across all devices.
 * Sends the ordered list of test IDs to the shared backend server and updates local cache.
 */
export async function reorderSectionalTests(
  orderedIds: number[]
): Promise<{ success: boolean; tests?: SectionalTest[]; error?: string }> {
  let updatedTests: SectionalTest[] | null = null;

  // 1. Primary: Shared Backend Server API
  const res = await fetch('/api/sectional-tests/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify({ testIds: orderedIds })
  });

  if (!res.ok) {
    throw new Error('Failed to save test order to server');
  }

  const data = await res.json();
  if (data && data.success && Array.isArray(data.tests)) {
    updatedTests = data.tests;
    setLocalTests(updatedTests);
  }

  // 2. Cloud Fallback: Supabase (if configured)
  if (isSupabaseConfigured) {
    try {
      const idMap = new Map(orderedIds.map((id, idx) => [Number(id), idx + 1]));
      for (const [id, order] of idMap.entries()) {
        await supabase
          .from('sectional_tests')
          .update({ sort_order: order, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch {}
  }

  return { success: true, tests: updatedTests || undefined };
}

// =============================================================================
// SECTIONAL TEST RESULTS: LATEST ATTEMPT ARCHITECTURE
// Enforces single latest result per (test_id, user_id) with no attempt history
// =============================================================================

function getUserResultsStorageKey(userId: string): string {
  return `ec_sectional_latest_results_${userId || 'guest'}`;
}

function getLocalLatestResultsMap(userId: string): Record<number, SectionalTestResult> {
  try {
    const raw = localStorage.getItem(getUserResultsStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalLatestResult(userId: string, testId: number, result: SectionalTestResult): void {
  try {
    const map = getLocalLatestResultsMap(userId);
    // REPLACEMENT: overwrite previous attempt completely
    map[testId] = result;
    localStorage.setItem(getUserResultsStorageKey(userId), JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to store latest result locally', err);
  }
}

function setAllLocalLatestResults(userId: string, map: Record<number, SectionalTestResult>): void {
  try {
    localStorage.setItem(getUserResultsStorageKey(userId), JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save local results map', err);
  }
}

export function normalizeSectionalResult(row: any): SectionalTestResult {
  const totalMarks = Number(row.total_marks) || 50;
  const score = Number(row.score) || 0;
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  return {
    id: row.id,
    test_id: Number(row.test_id),
    user_id: String(row.user_id),
    score,
    total_marks: totalMarks,
    correct_answers: Number(row.correct_answers) || 0,
    incorrect_answers: Number(row.incorrect_answers) || 0,
    unattempted_answers: Number(row.unattempted_answers) || 0,
    accuracy: Number(row.accuracy) || 0,
    negative_marks: Number(row.negative_marks) || 0,
    time_taken_seconds: Number(row.time_taken_seconds) || 0,
    answers: row.answers && typeof row.answers === 'object' ? row.answers : { questions: [], userAnswers: {} },
    completed_at: row.completed_at || row.created_at || new Date().toISOString(),
    created_at: row.created_at,
    updated_at: row.updated_at,
    percentage,
    test_title: row.test_title || undefined,
    subject: row.subject || undefined
  };
}

/**
 * Save or update the student's latest result for a Sectional Test.
 * Overwrites any existing result for (test_id, user_id).
 */
export async function saveLatestSectionalResult(params: {
  test: SectionalTest;
  questions: SectionalQuestion[];
  userAnswers: Record<number, string>;
  timeRemainingSeconds: number;
  userId: string;
}): Promise<{ success: boolean; result: SectionalTestResult; error?: string }> {
  const { test, questions, userAnswers, timeRemainingSeconds, userId } = params;

  const totalQ = questions.length || 1;
  const totalMarks = Number(test.total_marks) || 50;
  const marksPerQ = totalMarks / totalQ;
  const negMark = Number(test.negative_marking) ?? 0.25;

  let correct = 0;
  let incorrect = 0;

  const questionsDetailed: StoredQuestionAnswer[] = questions.map((q) => {
    const studentAns = userAnswers[q.question_order] || null;
    const isCorrect = Boolean(studentAns && studentAns.toUpperCase() === q.correct_option.toUpperCase());
    const isAttempted = Boolean(studentAns);
    const status: 'correct' | 'incorrect' | 'unattempted' = isCorrect
      ? 'correct'
      : isAttempted
      ? 'incorrect'
      : 'unattempted';

    if (isCorrect) correct++;
    else if (isAttempted) incorrect++;

    const marksAwarded = isCorrect ? Math.round(marksPerQ * 100) / 100 : isAttempted ? -negMark : 0;

    return {
      questionId: q.id,
      questionOrder: q.question_order,
      questionText: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      selectedOption: studentAns,
      correctOption: q.correct_option,
      status,
      marksAwarded,
      explanation: q.explanation || null
    };
  });

  const unattempted = totalQ - (correct + incorrect);
  const totalNegativeDeduction = Math.round(incorrect * negMark * 100) / 100;
  const rawScore = correct * marksPerQ - totalNegativeDeduction;
  const finalScore = Math.max(0, Math.round(rawScore * 100) / 100);
  const percentage = Math.round((finalScore / totalMarks) * 100);
  const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
  const durationSeconds = (test.duration_minutes || 20) * 60;
  const timeTaken = Math.max(0, durationSeconds - timeRemainingSeconds);

  const resultObj: SectionalTestResult = {
    test_id: Number(test.id),
    user_id: userId || 'guest',
    score: finalScore,
    total_marks: totalMarks,
    correct_answers: correct,
    incorrect_answers: incorrect,
    unattempted_answers: unattempted,
    accuracy,
    negative_marks: totalNegativeDeduction,
    time_taken_seconds: timeTaken,
    answers: {
      questions: questionsDetailed,
      userAnswers
    },
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    test_title: test.title,
    subject: test.subject,
    percentage
  };

  // 1. Supabase Persistence with UPSERT on (test_id, user_id)
  if (isSupabaseConfigured && userId && userId !== 'guest') {
    try {
      const { data, error } = await supabase
        .from('sectional_test_results')
        .upsert(
          {
            test_id: Number(test.id),
            user_id: userId,
            score: finalScore,
            total_marks: totalMarks,
            correct_answers: correct,
            incorrect_answers: incorrect,
            unattempted_answers: unattempted,
            accuracy,
            negative_marks: totalNegativeDeduction,
            time_taken_seconds: timeTaken,
            answers: {
              questions: questionsDetailed,
              userAnswers
            },
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'test_id,user_id' }
        )
        .select()
        .single();

      if (!error && data) {
        resultObj.id = data.id;
      } else if (error) {
        console.warn('[SectionalTest] Supabase upsert error:', error.message);
      }
    } catch (err: any) {
      console.warn('[SectionalTest] Supabase save error, fallback to local:', err?.message || err);
    }
  }

  // 2. Update local storage cache (overwrites any previous attempt for this test)
  setLocalLatestResult(userId, Number(test.id), resultObj);

  return { success: true, result: resultObj };
}

/**
 * Fetch a student's most recent completed attempt for a specific test.
 */
export async function fetchLatestStudentResult(
  testId: number,
  userId?: string | null
): Promise<SectionalTestResult | null> {
  const currentUserId = userId || 'guest';

  // Try Supabase if configured and user is authenticated
  if (isSupabaseConfigured && userId && userId !== 'guest') {
    try {
      const { data, error } = await supabase
        .from('sectional_test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const normalized = normalizeSectionalResult(data);
        setLocalLatestResult(userId, testId, normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('[SectionalTest] Error fetching latest result from Supabase:', err);
    }
  }

  // Fallback to local storage
  const localMap = getLocalLatestResultsMap(currentUserId);
  return localMap[testId] || null;
}

/**
 * Fetch all completed test results for the student (keyed by test_id).
 */
export async function fetchUserSectionalResults(
  userId?: string | null
): Promise<Record<number, SectionalTestResult>> {
  const currentUserId = userId || 'guest';

  if (isSupabaseConfigured && userId && userId !== 'guest') {
    try {
      const { data, error } = await supabase
        .from('sectional_test_results')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        const map: Record<number, SectionalTestResult> = {};
        data.forEach((row) => {
          map[Number(row.test_id)] = normalizeSectionalResult(row);
        });
        setAllLocalLatestResults(userId, map);
        return map;
      }
    } catch (err) {
      console.warn('[SectionalTest] Error fetching user results from Supabase:', err);
    }
  }

  return getLocalLatestResultsMap(currentUserId);
}

/**
 * Legacy compatibility functions:
 * Maps to single latest result per test to prevent attempt history
 */
export function saveTestAttempt(result: TestAttemptResult, userId?: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY);
    const list: TestAttemptResult[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((a) => a.testId !== result.testId);
    filtered.unshift(result);
    localStorage.setItem(LOCAL_STORAGE_ATTEMPTS_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.warn('Failed to save attempt in localStorage', err);
  }
}

export function getLatestAttemptForTest(testId: number): TestAttemptResult | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY);
    if (!raw) return null;
    const list: TestAttemptResult[] = JSON.parse(raw);
    return list.find((a) => a.testId === testId) || null;
  } catch {
    return null;
  }
}

