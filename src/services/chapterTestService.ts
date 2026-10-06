import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Chapter,
  ChapterTest,
  ChapterQuestion,
  ChapterTestResult,
  SectionalSubject,
  TestAttemptResult,
  StoredQuestionAnswer
} from '../types';

export const LOCAL_STORAGE_CHAPTERS_KEY = 'ec_chapters_v1';
export const LOCAL_STORAGE_CHAPTER_TESTS_KEY = 'ec_chapter_tests_v1';
export const LOCAL_STORAGE_CHAPTER_QUESTIONS_KEY = 'ec_chapter_questions_v1';
export const LOCAL_STORAGE_CHAPTER_RESULTS_KEY = 'ec_chapter_results_v1';
export const CHAPTER_DATA_CHANGED_EVENT = 'ec_chapter_data_changed';

// -----------------------------------------------------------------------------
// Cross-View Event Notification Helper
// -----------------------------------------------------------------------------

export function notifyChapterDataChanged(detail?: any): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHAPTER_DATA_CHANGED_EVENT, { detail }));
    }
  } catch {}
}

// -----------------------------------------------------------------------------
// Subject & Sub-Category Configuration
// -----------------------------------------------------------------------------

export const SUBJECT_SUB_CATEGORIES: Record<string, string[]> = {
  Mathematics: ['Arithmetic Mathematics', 'Advanced Mathematics'],
  Math: ['Arithmetic Mathematics', 'Advanced Mathematics'],
  History: ['Ancient History', 'Medieval History', 'Modern History'],
  Geography: ['Physical Geography', 'Indian Geography', 'World Geography'],
  Reasoning: ['Verbal Reasoning', 'Non-Verbal Reasoning', 'Logical/Analytical Reasoning'],
  Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry']
};

export function getSubCategoriesForSubject(subject: string): string[] | null {
  if (!subject) return null;
  const match = Object.keys(SUBJECT_SUB_CATEGORIES).find(
    (key) => key.toLowerCase() === subject.toLowerCase().trim()
  );
  return match ? SUBJECT_SUB_CATEGORIES[match] : null;
}

// -----------------------------------------------------------------------------
// Auth Headers Helper (Matches Sectional Test Architecture)
// -----------------------------------------------------------------------------

/**
 * Helper to retrieve current user session auth headers for Supabase RLS enforcement.
 * Ensures public.is_admin() evaluates properly on backend endpoints.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch {}
  return headers;
}

async function getJsonAuthHeaders(): Promise<Record<string, string>> {
  const headers = await getAuthHeaders();
  headers['Content-Type'] = 'application/json';
  return headers;
}

// -----------------------------------------------------------------------------
// Local Storage Cache Mirror Helpers
// Strict rule: LocalStorage is ONLY a passive mirror of confirmed server data.
// It is NEVER an alternative database or source of truth.
// -----------------------------------------------------------------------------

function getLocalChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          id: Number(item.id),
          subject: String(item.subject || ''),
          sub_category: item.sub_category ? String(item.sub_category) : undefined,
          name: String(item.name || ''),
          hindi_name: item.hindi_name ? String(item.hindi_name) : undefined,
          description: item.description ? String(item.description) : undefined,
          sort_order: item.sort_order !== undefined && item.sort_order !== null ? Number(item.sort_order) : 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        })).sort((a, b) => {
          const orderA = a.sort_order ?? 0;
          const orderB = b.sort_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        });
      }
    }
  } catch (err) {
    console.warn('Failed to parse local chapters', err);
  }
  return [];
}

function setLocalChapters(chapters: Chapter[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTERS_KEY, JSON.stringify(chapters));
  } catch (err) {
    console.warn('Failed to save local chapters', err);
  }
}

function updateLocalChapterInMirror(chapter: Chapter): void {
  const list = getLocalChapters();
  const idx = list.findIndex((c) => Number(c.id) === Number(chapter.id));
  if (idx >= 0) {
    list[idx] = chapter;
  } else {
    list.push(chapter);
  }
  setLocalChapters(list);
}

function removeLocalChapterFromMirror(chapterId: number): void {
  const list = getLocalChapters().filter((c) => Number(c.id) !== Number(chapterId));
  setLocalChapters(list);
}

function getLocalTests(): ChapterTest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTER_TESTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          id: Number(item.id),
          chapter_id: Number(item.chapter_id),
          title: String(item.title || ''),
          subject: String(item.subject || ''),
          chapter_name: item.chapter_name ? String(item.chapter_name) : undefined,
          total_questions: Number(item.total_questions || 0),
          total_marks: Number(item.total_marks || 50),
          duration_minutes: Number(item.duration_minutes || 20),
          negative_marking: Number(item.negative_marking ?? 0.25),
          published: Boolean(item.published !== false),
          sort_order: item.sort_order !== undefined && item.sort_order !== null ? Number(item.sort_order) : 0,
          created_by: item.created_by,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        })).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }
    }
  } catch (err) {
    console.warn('Failed to parse local tests', err);
  }
  return [];
}

function setLocalTests(tests: ChapterTest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_TESTS_KEY, JSON.stringify(tests));
  } catch (err) {
    console.warn('Failed to save local tests', err);
  }
}

function updateLocalTestInMirror(test: ChapterTest): void {
  const list = getLocalTests();
  const idx = list.findIndex((t) => Number(t.id) === Number(test.id));
  if (idx >= 0) {
    list[idx] = test;
  } else {
    list.push(test);
  }
  setLocalTests(list);
}

function removeLocalTestFromMirror(testId: number): void {
  const list = getLocalTests().filter((t) => Number(t.id) !== Number(testId));
  setLocalTests(list);
  const qMap = getLocalQuestions();
  delete qMap[testId];
  delete qMap[String(testId)];
  setLocalQuestions(qMap);
  try {
    localStorage.removeItem(`ec_chapter_questions_${testId}`);
  } catch {}
}

function getLocalQuestions(): Record<number, ChapterQuestion[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTER_QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse local chapter questions', err);
  }
  return {};
}

function setLocalQuestions(store: Record<number, ChapterQuestion[]>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_QUESTIONS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save local chapter questions', err);
  }
}

function getLocalResults(): Record<string, ChapterTestResult> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTER_RESULTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse local chapter results', err);
  }
  return {};
}

function setLocalResults(store: Record<string, ChapterTestResult>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_RESULTS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save local chapter results', err);
  }
}

// -----------------------------------------------------------------------------
// CHAPTERS API (Authoritative Server Persistence via /api/chapter-tests)
// -----------------------------------------------------------------------------

export async function fetchChapters(
  subject?: string,
  subCategory?: string,
  options?: { publishedOnly?: boolean }
): Promise<Chapter[]> {
  let chapters: Chapter[] = [];
  const normalizedSubject = subject ? subject.toLowerCase().trim() : '';

  // 1. Primary: Fetch from Shared Server Backend API (authoritative source)
  try {
    const params = new URLSearchParams();
    if (normalizedSubject && normalizedSubject !== 'all') {
      params.append('subject', subject!.trim());
    }
    if (subCategory && subCategory.trim() && subCategory.toLowerCase() !== 'all') {
      params.append('subCategory', subCategory.trim());
    }
    params.append('_t', String(Date.now()));

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/chapters?${params.toString()}`, {
      cache: 'no-store',
      headers: authHeaders
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        chapters = json.data as Chapter[];
        if (!subject || subject === 'All' || subject === 'all') {
          // If fetching all, authoritatively replace local mirror (even if empty [])
          setLocalChapters(chapters);
        } else if (subCategory && subCategory.trim() && subCategory.toLowerCase() !== 'all') {
          // If sub-category filtered, replace only that sub-category's records for this subject
          const normSub = subCategory.trim().toLowerCase();
          const isMath = normalizedSubject === 'mathematics' || normalizedSubject === 'math';
          const preserved = getLocalChapters().filter((c) => {
            const cSub = (c.subject || '').toLowerCase().trim();
            const isSameSubject = isMath
              ? cSub === 'mathematics' || cSub === 'math'
              : cSub === normalizedSubject;
            if (!isSameSubject) return true;
            return (c.sub_category || '').toLowerCase().trim() !== normSub;
          });
          setLocalChapters([...preserved, ...chapters]);
        } else {
          // For the currently selected subject:
          // - replace the subject's chapter records with the fresh server response;
          // - preserve chapters belonging to other subjects;
          // - do NOT merge stale records back into the selected subject;
          // - do NOT resurrect deleted records from localStorage.
          const isMath = normalizedSubject === 'mathematics' || normalizedSubject === 'math';
          const otherSubjectChapters = getLocalChapters().filter((c) => {
            const cSub = (c.subject || '').toLowerCase().trim();
            if (isMath) {
              return cSub !== 'mathematics' && cSub !== 'math';
            }
            return cSub !== normalizedSubject;
          });
          setLocalChapters([...otherSubjectChapters, ...chapters]);
        }
      }
    }
  } catch (err) {
    console.info('[ChapterTest] Server fetch notice, checking local mirror:', err);
    // Offline fallback only on network error
    const isMath = normalizedSubject === 'mathematics' || normalizedSubject === 'math';
    const all = getLocalChapters();
    chapters = (normalizedSubject && normalizedSubject !== 'all')
      ? all.filter((c) => {
          const cSub = (c.subject || '').toLowerCase().trim();
          return isMath ? cSub === 'mathematics' || cSub === 'math' : cSub === normalizedSubject;
        })
      : all;
    if (subCategory && subCategory.trim() && subCategory.toLowerCase() !== 'all') {
      const normSub = subCategory.toLowerCase().trim();
      chapters = chapters.filter(
        (c) => c.sub_category && c.sub_category.toLowerCase().trim() === normSub
      );
    }
  }

  // Calculate test_count for each chapter
  const isPublishedOnly = options?.publishedOnly ?? false;
  const tests = await fetchChapterTests({ publishedOnly: isPublishedOnly });
  const counts: Record<number, number> = {};
  tests.forEach((t) => {
    counts[Number(t.chapter_id)] = (counts[Number(t.chapter_id)] || 0) + 1;
  });

  return chapters.map((c) => ({
    ...c,
    test_count: counts[Number(c.id)] || 0
  }));
}

/**
 * Save a chapter (Create or Update).
 * MANDATORY: Persists to the shared server database.
 * If server save fails, throws error immediately. Never saves fake local records.
 */
export async function saveChapter(payload: Partial<Chapter>): Promise<Chapter> {
  const headers = await getJsonAuthHeaders();
  const res = await fetch('/api/chapter-tests/chapters', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: payload.id ? Number(payload.id) : undefined,
      subject: String(payload.subject || '').trim(),
      sub_category: payload.sub_category ? String(payload.sub_category).trim() : null,
      name: String(payload.name || '').trim(),
      hindi_name: payload.hindi_name ? String(payload.hindi_name).trim() : null,
      description: payload.description ? String(payload.description).trim() : null,
      sort_order: payload.sort_order ?? 0
    })
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

  const json = await res.json();
  if (!json || !json.success || !json.data) {
    throw new Error(json?.error || 'Server did not return confirmed chapter data');
  }

  const savedChapter: Chapter = json.data;

  // Authoritatively update local cache mirror
  updateLocalChapterInMirror(savedChapter);

  notifyChapterDataChanged({
    type: 'chapter_saved',
    chapterId: savedChapter.id,
    subject: savedChapter.subject,
    subCategory: savedChapter.sub_category
  });

  return savedChapter;
}

/**
 * Delete a chapter from the shared persistent backend and local mirror.
 */
export async function deleteChapter(chapterId: number): Promise<boolean> {
  const numId = Number(chapterId);
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`/api/chapter-tests/chapters/${numId}`, {
    method: 'DELETE',
    headers: authHeaders
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to delete chapter (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  // Remove from local mirror
  removeLocalChapterFromMirror(numId);

  // Cascade clean tests belonging to this chapter in local mirror
  const remainingTests = getLocalTests().filter((t) => Number(t.chapter_id) !== numId);
  setLocalTests(remainingTests);

  notifyChapterDataChanged({
    type: 'chapter_deleted',
    chapterId: numId
  });

  return true;
}

export async function reorderChapters(orderedIds: number[]): Promise<boolean> {
  const headers = await getJsonAuthHeaders();
  const res = await fetch('/api/chapter-tests/chapters/reorder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderedIds })
  });

  if (!res.ok) {
    throw new Error('Failed to persist chapter order on server');
  }

  // Update local mirror
  const localChapters = getLocalChapters();
  const chapterMap = new Map(localChapters.map((c) => [Number(c.id), c]));
  orderedIds.forEach((id, index) => {
    const chap = chapterMap.get(Number(id));
    if (chap) {
      chap.sort_order = index + 1;
    }
  });
  setLocalChapters(Array.from(chapterMap.values()));

  notifyChapterDataChanged({ type: 'chapters_reordered', orderedIds });
  return true;
}

// -----------------------------------------------------------------------------
// CHAPTER TESTS API (Authoritative Server Persistence via /api/chapter-tests)
// -----------------------------------------------------------------------------

export async function fetchChapterTests(options?: {
  chapterId?: number;
  subject?: string;
  publishedOnly?: boolean;
}): Promise<ChapterTest[]> {
  try {
    const params = new URLSearchParams();
    if (options?.chapterId) {
      params.append('chapterId', String(options.chapterId));
    }
    if (options?.subject && options.subject !== 'All') {
      params.append('subject', options.subject.trim());
    }
    if (options?.publishedOnly) {
      params.append('publishedOnly', 'true');
    }
    params.append('_t', String(Date.now()));

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/tests?${params.toString()}`, {
      cache: 'no-store',
      headers: authHeaders
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const tests = json.data as ChapterTest[];
        if (!options?.chapterId && (!options?.subject || options.subject === 'All')) {
          setLocalTests(tests);
        } else if (options?.chapterId) {
          const cid = Number(options.chapterId);
          const others = getLocalTests().filter((t) => Number(t.chapter_id) !== cid);
          setLocalTests([...others, ...tests]);
        }
        return tests;
      }
    }
  } catch (err) {
    console.info('[ChapterTest] Server tests fetch notice, using local mirror:', err);
  }

  // Offline fallback only on network failure
  let local = getLocalTests();
  if (options?.chapterId) {
    local = local.filter((t) => Number(t.chapter_id) === Number(options.chapterId));
  }
  if (options?.subject && options.subject !== 'All') {
    const sub = options.subject.toLowerCase().trim();
    local = local.filter((t) => (t.subject || '').toLowerCase().trim() === sub);
  }
  if (options?.publishedOnly) {
    local = local.filter((t) => t.published !== false);
  }
  return local;
}

export async function fetchChapterTestById(id: number | string): Promise<ChapterTest | null> {
  const numId = Number(id);
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/tests/${numId}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: authHeaders
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data as ChapterTest;
      }
    } else if (res.status === 404) {
      return null;
    }
  } catch {}

  const local = getLocalTests().find((t) => Number(t.id) === numId);
  return local || null;
}

/**
 * Save a chapter test and optionally its questions.
 * MANDATORY: Persists to the shared server database.
 * If server save fails, throws error immediately. Never saves fake local records.
 */
export async function saveChapterTest(
  payload: Partial<ChapterTest>,
  questions?: ChapterQuestion[]
): Promise<ChapterTest> {
  const headers = await getJsonAuthHeaders();
  const totalQuestions = Array.isArray(questions) ? questions.length : Number(payload.total_questions || 0);

  const res = await fetch('/api/chapter-tests/tests', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: payload.id ? Number(payload.id) : undefined,
      chapter_id: Number(payload.chapter_id),
      title: String(payload.title || '').trim(),
      subject: String(payload.subject || '').trim(),
      total_questions: totalQuestions,
      total_marks: Number(payload.total_marks ?? 50),
      duration_minutes: Number(payload.duration_minutes ?? 20),
      negative_marking: Number(payload.negative_marking ?? 0.25),
      published: payload.published !== undefined ? Boolean(payload.published) : true,
      sort_order: payload.sort_order ?? 0
    })
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

  const json = await res.json();
  if (!json || !json.success || !json.data) {
    throw new Error(json?.error || 'Server did not return confirmed test data');
  }

  const savedTest: ChapterTest = json.data;

  // If questions are provided, persist questions to server as well
  if (Array.isArray(questions)) {
    await saveChapterQuestions(savedTest.id, questions, { skipNotify: true });
    savedTest.total_questions = questions.length;
  }

  // Update local cache mirror
  updateLocalTestInMirror(savedTest);

  notifyChapterDataChanged({
    type: 'test_saved',
    testId: savedTest.id,
    chapterId: savedTest.chapter_id,
    subject: savedTest.subject
  });

  return savedTest;
}

export async function deleteChapterTest(testId: number): Promise<boolean> {
  const numId = Number(testId);
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`/api/chapter-tests/tests/${numId}`, {
    method: 'DELETE',
    headers: authHeaders
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to delete test (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  // Remove from local mirror
  removeLocalTestFromMirror(numId);

  notifyChapterDataChanged({
    type: 'test_deleted',
    testId: numId
  });

  return true;
}

export async function togglePublishChapterTest(testId: number, published: boolean): Promise<boolean> {
  const numId = Number(testId);
  const headers = await getJsonAuthHeaders();
  const res = await fetch(`/api/chapter-tests/tests/${numId}/publish`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ published })
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to toggle publish status (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  // Update local mirror
  const currentTests = getLocalTests();
  const test = currentTests.find((t) => Number(t.id) === numId);
  if (test) {
    test.published = published;
    setLocalTests(currentTests);
  }

  notifyChapterDataChanged({
    type: 'test_publish_toggled',
    testId: numId,
    published,
    chapterId: test?.chapter_id,
    subject: test?.subject
  });

  return true;
}

export async function reorderChapterTests(orderedIds: number[]): Promise<boolean> {
  const headers = await getJsonAuthHeaders();
  const res = await fetch('/api/chapter-tests/tests/reorder', {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderedIds })
  });

  if (!res.ok) {
    throw new Error('Failed to persist test order on server');
  }

  // Update local mirror
  const localTests = getLocalTests();
  const map = new Map(localTests.map((t) => [Number(t.id), t]));
  orderedIds.forEach((id, index) => {
    const t = map.get(Number(id));
    if (t) {
      t.sort_order = index + 1;
    }
  });
  setLocalTests(Array.from(map.values()));

  notifyChapterDataChanged({ type: 'tests_reordered', orderedIds });
  return true;
}

// -----------------------------------------------------------------------------
// CHAPTER QUESTIONS API (Authoritative Server Persistence via /api/chapter-tests)
// -----------------------------------------------------------------------------

export async function fetchChapterQuestions(testId: number | string): Promise<ChapterQuestion[]> {
  const numId = Number(testId);

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/tests/${numId}/questions?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: authHeaders
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const questions = json.data as ChapterQuestion[];
        const allQuestions = getLocalQuestions();
        allQuestions[numId] = questions;
        setLocalQuestions(allQuestions);
        try {
          localStorage.setItem(`ec_chapter_questions_${numId}`, JSON.stringify(questions));
        } catch {}
        return questions;
      }
    }
  } catch (err) {
    console.info('[ChapterTest] Questions fetch notice, using local mirror:', err);
  }

  const localQuestions = getLocalQuestions();
  if (localQuestions[numId] && Array.isArray(localQuestions[numId])) {
    return localQuestions[numId];
  }
  try {
    const singleRaw = localStorage.getItem(`ec_chapter_questions_${numId}`);
    if (singleRaw) {
      const parsed = JSON.parse(singleRaw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}

export async function saveChapterQuestions(
  testId: number,
  questions: ChapterQuestion[],
  options?: { skipNotify?: boolean }
): Promise<ChapterQuestion[]> {
  const numId = Number(testId);
  const formattedQuestions: ChapterQuestion[] = questions.map((q, idx) => ({
    test_id: numId,
    question_order: q.question_order || idx + 1,
    question_text: String(q.question_text || '').trim(),
    option_a: String(q.option_a || '').trim(),
    option_b: String(q.option_b || '').trim(),
    option_c: String(q.option_c || '').trim(),
    option_d: String(q.option_d || '').trim(),
    correct_option: String(q.correct_option || 'A').trim().toUpperCase(),
    explanation: q.explanation ? String(q.explanation).trim() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const headers = await getJsonAuthHeaders();
  const res = await fetch(`/api/chapter-tests/tests/${numId}/questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ questions: formattedQuestions })
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Failed to save questions on server (${res.status})`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error) errorMessage = errJson.error;
    } catch {}
    throw new Error(errorMessage);
  }

  // Update local mirror
  const allQuestions = getLocalQuestions();
  allQuestions[numId] = formattedQuestions;
  setLocalQuestions(allQuestions);
  try {
    localStorage.setItem(`ec_chapter_questions_${numId}`, JSON.stringify(formattedQuestions));
  } catch {}

  // Update local test question count
  const localTests = getLocalTests();
  const test = localTests.find((t) => Number(t.id) === numId);
  if (test) {
    test.total_questions = formattedQuestions.length;
    setLocalTests(localTests);
  }

  if (!options?.skipNotify) {
    notifyChapterDataChanged({
      type: 'questions_saved',
      testId: numId,
      count: formattedQuestions.length,
      chapterId: test?.chapter_id,
      subject: test?.subject
    });
  }

  return formattedQuestions;
}

// -----------------------------------------------------------------------------
// CHAPTER RESULTS / ATTEMPTS API (Latest result per user per test)
// -----------------------------------------------------------------------------

export async function saveLatestChapterResult(result: ChapterTestResult): Promise<ChapterTestResult> {
  const timestamp = new Date().toISOString();
  const normalizedResult: ChapterTestResult = {
    ...result,
    completed_at: result.completed_at || timestamp,
    created_at: result.created_at || timestamp,
    updated_at: timestamp
  };

  if (isSupabaseConfigured && result.user_id) {
    try {
      const { data, error } = await supabase
        .from('chapter_test_results')
        .upsert(
          {
            test_id: result.test_id,
            user_id: result.user_id,
            score: result.score,
            total_marks: result.total_marks,
            correct_answers: result.correct_answers,
            incorrect_answers: result.incorrect_answers,
            unattempted_answers: result.unattempted_answers,
            accuracy: result.accuracy,
            negative_marks: result.negative_marks,
            time_taken_seconds: result.time_taken_seconds,
            answers: result.answers,
            completed_at: normalizedResult.completed_at,
            updated_at: timestamp
          },
          { onConflict: 'test_id,user_id' }
        )
        .select()
        .single();
      if (!error && data) {
        normalizedResult.id = data.id;
      }
    } catch {}
  }

  // Save to local cache key
  const localResults = getLocalResults();
  const key = `${result.test_id}_${result.user_id || 'guest'}`;
  localResults[key] = normalizedResult;
  setLocalResults(localResults);

  return normalizedResult;
}

export async function fetchLatestChapterStudentResult(
  testId: number,
  userId?: string
): Promise<ChapterTestResult | null> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('chapter_test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) {
        return data as ChapterTestResult;
      }
    } catch {}
  }

  const localResults = getLocalResults();
  const key = `${testId}_${userId || 'guest'}`;
  return localResults[key] || null;
}

export async function fetchUserChapterResults(
  userId?: string
): Promise<Record<number, ChapterTestResult>> {
  const resultMap: Record<number, ChapterTestResult> = {};

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('chapter_test_results')
        .select('*')
        .eq('user_id', userId);
      if (!error && Array.isArray(data)) {
        data.forEach((r) => {
          resultMap[r.test_id] = r as ChapterTestResult;
        });
        return resultMap;
      }
    } catch {}
  }

  const localResults = getLocalResults();
  const userPrefix = `_${userId || 'guest'}`;
  Object.entries(localResults).forEach(([key, val]) => {
    if (key.endsWith(userPrefix)) {
      resultMap[val.test_id] = val;
    }
  });

  return resultMap;
}

/**
 * Synchronize local cache with the authoritative server database.
 */
export async function syncLocalChapterDataWithServer(): Promise<void> {
  try {
    const chapters = await fetchChapters();
    const tests = await fetchChapterTests();
    notifyChapterDataChanged({ type: 'sync_completed', chaptersCount: chapters.length, testsCount: tests.length });
  } catch (err) {
    console.info('[ChapterTest] Background sync notice:', err);
  }
}
