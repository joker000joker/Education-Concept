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
    const testsMap = new Map<number | string, SectionalTest>();

    // 1. Scan primary and all historical variant keys
    for (const key of POSSIBLE_TEST_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.title) {
              const testId = Number(item.id) || Date.now();
              if (!testsMap.has(testId)) {
                testsMap.set(testId, {
                  id: testId,
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
                });
              }
            }
          }
        }
      } catch {}
    }

    // 2. Also scan any other key in localStorage that may contain tests
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.includes('sectional') || k.includes('test')) &&
          !POSSIBLE_TEST_KEYS.includes(k) &&
          !k.includes('question') &&
          !k.includes('attempt') &&
          !k.includes('result')
        ) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item && item.title && (item.subject || item.total_questions)) {
                  const testId = Number(item.id) || Date.now();
                  if (!testsMap.has(testId)) {
                    testsMap.set(testId, {
                      id: testId,
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
                    });
                  }
                }
              }
            }
          } catch {}
        }
      }
    } catch {}

    // Empty test lists remain empty.
    const list = Array.from(testsMap.values());
    list.sort((a, b) => {
      const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : Infinity;
      const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return list;
  } catch (err) {
    return [];
  }
}

function setLocalTests(tests: SectionalTest[]): void {
  try {
    const serialized = JSON.stringify(tests);
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, serialized);
    localStorage.setItem('ec_sectional_tests_v1', serialized);
    localStorage.setItem('ec_sectional_tests_cache', serialized);
    localStorage.setItem('sectional_tests', serialized);
  } catch (err) {
    console.warn('Failed to save tests to localStorage', err);
  }
}

function getLocalQuestions(testId: number): SectionalQuestion[] {
  try {
    const numId = Number(testId);
    for (const key of POSSIBLE_QUESTION_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const map = JSON.parse(raw);
        if (map && (map[numId] || map[String(numId)])) {
          const list = map[numId] || map[String(numId)];
          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        }
      } catch {}
    }
    // Also check individual question key: ec_sectional_questions_${testId}
    const singleRaw = localStorage.getItem(`ec_sectional_questions_${numId}`);
    if (singleRaw) {
      try {
        const list = JSON.parse(singleRaw);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {}
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
    localStorage.setItem('ec_sectional_questions_cache', serialized);
    localStorage.setItem('sectional_questions', serialized);
  } catch (err) {
    console.warn('Failed to save questions to localStorage', err);
  }
}

function removeLocalTest(testId: number): void {
  const tests = getLocalTests().filter((t) => t.id !== testId);
  setLocalTests(tests);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[testId];
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(map));
    }
    localStorage.removeItem(`ec_sectional_questions_${testId}`);
  } catch {}
}

let isSyncing = false;
let hasSyncedOnce = false;

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
 * Automatically synchronizes any locally created tests (e.g. tests created from mobile)
 * to the shared server database so they immediately appear on desktop and all devices.
 */
export async function syncLocalTestsWithServer(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const local = getLocalTests();
    const questionsMap: Record<string, SectionalQuestion[]> = {};

    for (const t of local) {
      const qList = getLocalQuestions(t.id);
      if (qList && qList.length > 0) {
        questionsMap[String(t.id)] = qList;
      }
    }

    if (local.length > 0 || Object.keys(questionsMap).length > 0) {
      const res = await fetch('/api/sectional-tests/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests: local, questionsMap })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tests) && data.tests.length > 0) {
          mergeServerTestsIntoLocal(data.tests);
        }
      }
    }
    hasSyncedOnce = true;
  } catch (err) {
    console.info('[SectionalTest] Background sync notice:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Fetch sectional tests from the shared backend API with automatic two-way synchronization.
 * Both Mobile and Desktop use this same unified source of truth.
 */
export async function fetchSectionalTests(options?: {
  subject?: string;
  publishedOnly?: boolean;
}): Promise<SectionalTest[]> {
  // Sync any local tests from this device into the shared backend in background
  syncLocalTestsWithServer().catch(() => {});

  // 1. Primary: Fetch from Shared Server Backend API
  try {
    const params = new URLSearchParams();
    if (options?.publishedOnly) params.append('publishedOnly', 'true');
    if (options?.subject && options.subject !== 'All') params.append('subject', options.subject);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`/api/sectional-tests${queryStr}`);
    if (response.ok) {
      const serverTests = await response.json();
      if (Array.isArray(serverTests)) {
        setLocalTests(serverTests);
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
    const res = await fetch(`/api/sectional-tests/${numId}`);
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
    const res = await fetch(`/api/sectional-tests/${numId}/questions`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
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
 */
export async function saveSectionalTest(
  testData: Partial<SectionalTest>,
  questions: SectionalQuestion[]
): Promise<{ success: boolean; testId: number; error?: string }> {
  const totalQuestions = questions.length;
  const targetId = testData.id || Date.now();

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

  // 1. Primary: Save to Shared Server API
  let serverSaved = false;
  let savedId = targetId;

  try {
    const res = await fetch('/api/sectional-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: payloadTest, questions })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.test) {
        savedId = data.test.id;
        payloadTest.id = savedId;
        serverSaved = true;
      }
    }
  } catch (err) {
    console.info('[SectionalTest] Server save notice, using local persistence:', err);
  }

  // 2. Always update local cache on the current device
  updateLocalTest(payloadTest, questions);

  // 3. Mirror to Supabase if configured and table exists
  if (isSupabaseConfigured) {
    try {
      const isEditing = Boolean(testData.id);
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('sectional_tests')
          .update({
            title: payloadTest.title,
            subject: payloadTest.subject,
            total_questions: totalQuestions,
            total_marks: payloadTest.total_marks,
            duration_minutes: payloadTest.duration_minutes,
            negative_marking: payloadTest.negative_marking,
            published: payloadTest.published,
            updated_at: new Date().toISOString()
          })
          .eq('id', payloadTest.id);

        if (!updateError) {
          await supabase.from('sectional_questions').delete().eq('test_id', payloadTest.id);
          const questionsPayload = questions.map((q, idx) => ({
            test_id: payloadTest.id,
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
            title: payloadTest.title,
            subject: payloadTest.subject,
            total_questions: totalQuestions,
            total_marks: payloadTest.total_marks,
            duration_minutes: payloadTest.duration_minutes,
            negative_marking: payloadTest.negative_marking,
            published: payloadTest.published
          })
          .select()
          .single();

        if (!insertError && inserted) {
          const newId = inserted.id;
          const questionsPayload = questions.map((q, idx) => ({
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

  return { success: true, testId: savedId };
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
 * Delete a sectional test
 */
export async function deleteSectionalTest(id: number): Promise<{ success: boolean; error?: string }> {
  // 1. Primary: Server API
  try {
    await fetch(`/api/sectional-tests/${id}`, { method: 'DELETE' });
  } catch {}

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
 * Toggle published state
 */
export async function togglePublishSectionalTest(
  id: number,
  published: boolean
): Promise<{ success: boolean; error?: string }> {
  // 1. Primary: Server API
  try {
    await fetch(`/api/sectional-tests/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published })
    });
  } catch {}

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
  const tests = getLocalTests().map((t) => (t.id === id ? { ...t, published } : t));
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
  try {
    const res = await fetch('/api/sectional-tests/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testIds: orderedIds })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.tests)) {
        updatedTests = data.tests;
        setLocalTests(updatedTests);
      }
    }
  } catch (err) {
    console.warn('[SectionalTest] Reorder API notice, falling back to local persistence:', err);
  }

  // 2. Local Cache Update
  const idMap = new Map(orderedIds.map((id, idx) => [Number(id), idx + 1]));
  if (!updatedTests) {
    const local = getLocalTests();
    updatedTests = local.map((t) => {
      if (idMap.has(Number(t.id))) {
        return {
          ...t,
          sort_order: idMap.get(Number(t.id))!,
          updated_at: new Date().toISOString()
        };
      }
      return t;
    });
    updatedTests.sort((a, b) => {
      const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : Infinity;
      const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    setLocalTests(updatedTests);
  }

  // 3. Cloud Fallback: Supabase (if configured)
  if (isSupabaseConfigured) {
    try {
      for (const [id, order] of idMap.entries()) {
        await supabase
          .from('sectional_tests')
          .update({ sort_order: order, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch {}
  }

  return { success: true, tests: updatedTests };
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

