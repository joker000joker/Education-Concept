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

function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function getLocalChapters(): Chapter[] {
  if (!isLocalStorageAvailable()) return [];
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
  if (!isLocalStorageAvailable()) return;
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
  if (!isLocalStorageAvailable()) return [];
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
  if (!isLocalStorageAvailable()) return;
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
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(`ec_chapter_questions_${testId}`);
    } catch {}
  }
}

function getLocalQuestions(): Record<number, ChapterQuestion[]> {
  if (!isLocalStorageAvailable()) return {};
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
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_QUESTIONS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save local chapter questions', err);
  }
}

function getLocalResults(): Record<string, ChapterTestResult> {
  if (!isLocalStorageAvailable()) return {};
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
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_RESULTS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save local chapter results', err);
  }
}

function syncChaptersIntoLocalMirror(chapters: Chapter[], subject?: string, subCategory?: string): void {
  const normalizedSubject = subject ? subject.toLowerCase().trim() : '';
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
    // - replace the subject's chapter records with the fresh response;
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

// -----------------------------------------------------------------------------
// Response Shape Validation Helpers
// Prevents incorrect payloads (e.g., Sectional Tests accidentally returned by
// misrouted servers) from being mistaken for valid chapter or chapter-test data.
// -----------------------------------------------------------------------------

export function isValidChapterRecord(item: any): boolean {
  return Boolean(
    item &&
    typeof item === 'object' &&
    (typeof item.id === 'number' || typeof item.id === 'string') &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    typeof item.subject === 'string'
  );
}

export function isValidChapterTestRecord(item: any): boolean {
  return Boolean(
    item &&
    typeof item === 'object' &&
    (typeof item.id === 'number' || typeof item.id === 'string') &&
    item.chapter_id !== undefined &&
    item.chapter_id !== null &&
    typeof item.title === 'string' &&
    item.title.trim().length > 0
  );
}

// -----------------------------------------------------------------------------
// CHAPTERS API (Authoritative Server Persistence with Direct Supabase Fallback)
// -----------------------------------------------------------------------------

export async function fetchChapters(
  subject?: string,
  subCategory?: string,
  options?: { publishedOnly?: boolean }
): Promise<Chapter[]> {
  let chapters: Chapter[] = [];
  const normalizedSubject = subject ? subject.toLowerCase().trim() : '';
  let serverFetched = false;

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
      let candidateList: any[] | null = null;
      if (json && json.success && Array.isArray(json.data)) {
        candidateList = json.data;
      } else if (Array.isArray(json)) {
        candidateList = json;
      }

      const isShapeValid =
        candidateList !== null &&
        (candidateList.length === 0 || candidateList.every(isValidChapterRecord));

      if (isShapeValid && candidateList !== null) {
        chapters = candidateList.map((c: any) => ({
          id: Number(c.id),
          subject: String(c.subject || ''),
          sub_category: c.sub_category ? String(c.sub_category) : undefined,
          name: String(c.name || ''),
          hindi_name: c.hindi_name ? String(c.hindi_name) : undefined,
          description: c.description ? String(c.description) : undefined,
          sort_order: c.sort_order !== undefined && c.sort_order !== null ? Number(c.sort_order) : 0,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString()
        }));
        serverFetched = true;
        syncChaptersIntoLocalMirror(chapters, subject, subCategory);
      } else {
        console.warn('[ChapterTest] Server returned invalid chapter shape, triggering Supabase fallback');
      }
    } else {
      console.info(`[ChapterTest] Server /chapters returned ${res.status}, falling back to Supabase client.`);
    }
  } catch (err) {
    console.info('[ChapterTest] Server fetch notice, checking direct Supabase:', err);
  }

  // 2. Cloud Fallback: Direct Supabase PostgreSQL Query (Matches Sectional Test Architecture)
  if (!serverFetched && isSupabaseConfigured) {
    try {
      let query = supabase.from('chapters').select('*');
      if (normalizedSubject && normalizedSubject !== 'all') {
        if (normalizedSubject === 'math' || normalizedSubject === 'mathematics') {
          query = query.in('subject', ['Math', 'Mathematics', 'math', 'mathematics']);
        } else {
          query = query.ilike('subject', subject!.trim());
        }
      }
      if (subCategory && subCategory.trim() && subCategory.toLowerCase() !== 'all') {
        query = query.ilike('sub_category', subCategory.trim());
      }
      const { data, error } = await query
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        chapters = data.map((row: any) => ({
          id: Number(row.id),
          subject: String(row.subject || ''),
          sub_category: row.sub_category ? String(row.sub_category) : undefined,
          name: String(row.name || ''),
          hindi_name: row.hindi_name ? String(row.hindi_name) : undefined,
          description: row.description ? String(row.description) : undefined,
          sort_order: row.sort_order !== undefined && row.sort_order !== null ? Number(row.sort_order) : 0,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
        serverFetched = true;
        syncChaptersIntoLocalMirror(chapters, subject, subCategory);
      } else if (error) {
        console.warn('[ChapterTest] Direct Supabase chapters query error:', error.message);
      }
    } catch (sbErr) {
      console.warn('[ChapterTest] Direct Supabase chapters query exception:', sbErr);
    }
  }

  // 3. Device Cache Fallback (Offline only when both server and direct Supabase fail)
  if (!serverFetched) {
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
 * MANDATORY: Persists to the shared server database backed by Supabase PostgreSQL.
 * If server endpoint fails, automatically falls back to direct Supabase client persistence.
 */
export async function saveChapter(payload: Partial<Chapter>): Promise<Chapter> {
  const headers = await getJsonAuthHeaders();
  let serverSaved: Chapter | null = null;
  let serverError: string | null = null;

  // 1. Primary: Server API
  try {
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

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        serverSaved = json.data as Chapter;
      }
    } else {
      const errorText = await res.text();
      let errorMessage = `Server save failed (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error connecting to chapter server';
  }

  if (serverSaved) {
    updateLocalChapterInMirror(serverSaved);
    notifyChapterDataChanged({
      type: 'chapter_saved',
      chapterId: serverSaved.id,
      subject: serverSaved.subject,
      subCategory: serverSaved.sub_category
    });
    return serverSaved;
  }

  // 2. Cloud Fallback: Direct Supabase Write if server route failed
  if (isSupabaseConfigured) {
    try {
      let sbData: any = null;
      if (payload.id) {
        const { data, error } = await supabase
          .from('chapters')
          .update({
            subject: String(payload.subject || '').trim(),
            sub_category: payload.sub_category ? String(payload.sub_category).trim() : null,
            name: String(payload.name || '').trim(),
            hindi_name: payload.hindi_name ? String(payload.hindi_name).trim() : null,
            description: payload.description ? String(payload.description).trim() : null,
            sort_order: payload.sort_order ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', Number(payload.id))
          .select()
          .single();
        if (!error && data) sbData = data;
        else if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from('chapters')
          .insert({
            subject: String(payload.subject || '').trim(),
            sub_category: payload.sub_category ? String(payload.sub_category).trim() : null,
            name: String(payload.name || '').trim(),
            hindi_name: payload.hindi_name ? String(payload.hindi_name).trim() : null,
            description: payload.description ? String(payload.description).trim() : null,
            sort_order: payload.sort_order ?? 0
          })
          .select()
          .single();
        if (!error && data) sbData = data;
        else if (error) throw new Error(error.message);
      }

      if (sbData) {
        const savedChapter: Chapter = sbData;
        updateLocalChapterInMirror(savedChapter);
        notifyChapterDataChanged({
          type: 'chapter_saved',
          chapterId: savedChapter.id,
          subject: savedChapter.subject,
          subCategory: savedChapter.sub_category
        });
        return savedChapter;
      }
    } catch (sbErr: any) {
      console.warn('[ChapterTest] Direct Supabase save chapter error:', sbErr);
      throw new Error(serverError || sbErr?.message || 'Failed to save chapter to database');
    }
  }

  throw new Error(serverError || 'Failed to save chapter to server or database');
}

/**
 * Delete a chapter from the shared persistent backend and local mirror.
 */
export async function deleteChapter(chapterId: number): Promise<boolean> {
  const numId = Number(chapterId);
  const authHeaders = await getAuthHeaders();
  let serverDeleted = false;
  let serverError: string | null = null;

  try {
    const res = await fetch(`/api/chapter-tests/chapters/${numId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (res.ok) {
      serverDeleted = true;
    } else {
      const errorText = await res.text();
      let errorMessage = `Failed to delete chapter (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error deleting chapter';
  }

  // Cloud Fallback: Direct Supabase Delete
  if (!serverDeleted && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', numId);
      if (!error) {
        serverDeleted = true;
      } else {
        throw new Error(error.message);
      }
    } catch (sbErr: any) {
      throw new Error(serverError || sbErr?.message || 'Failed to delete chapter');
    }
  }

  if (!serverDeleted) {
    throw new Error(serverError || 'Failed to delete chapter');
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
  let serverPersisted = false;

  try {
    const res = await fetch('/api/chapter-tests/chapters/reorder', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderedIds })
    });

    if (res.ok) {
      serverPersisted = true;
    }
  } catch {}

  // Cloud Fallback: Direct Supabase Update
  if (!serverPersisted && isSupabaseConfigured) {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('chapters').update({ sort_order: index + 1 }).eq('id', id)
        )
      );
      serverPersisted = true;
    } catch {}
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
// CHAPTER TESTS API (Authoritative Server Persistence with Direct Supabase Fallback)
// -----------------------------------------------------------------------------

export async function fetchChapterTests(options?: {
  chapterId?: number;
  subject?: string;
  publishedOnly?: boolean;
}): Promise<ChapterTest[]> {
  let tests: ChapterTest[] = [];
  let serverFetched = false;

  // 1. Primary: Shared Server Backend API
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
      let candidateList: any[] | null = null;
      if (json && json.success && Array.isArray(json.data)) {
        candidateList = json.data;
      } else if (Array.isArray(json)) {
        candidateList = json;
      }

      const isShapeValid =
        candidateList !== null &&
        (candidateList.length === 0 || candidateList.every(isValidChapterTestRecord));

      if (isShapeValid && candidateList !== null) {
        tests = candidateList.map((t: any) => ({
          id: Number(t.id),
          chapter_id: Number(t.chapter_id),
          title: String(t.title || ''),
          subject: String(t.subject || ''),
          chapter_name: t.chapter_name ? String(t.chapter_name) : undefined,
          total_questions: Number(t.total_questions || 0),
          total_marks: Number(t.total_marks || 50),
          duration_minutes: Number(t.duration_minutes || 20),
          negative_marking: Number(t.negative_marking ?? 0.25),
          published: Boolean(t.published !== false),
          sort_order: t.sort_order !== undefined && t.sort_order !== null ? Number(t.sort_order) : 0,
          created_by: t.created_by,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString()
        }));
        serverFetched = true;
        if (!options?.chapterId && (!options?.subject || options.subject === 'All')) {
          setLocalTests(tests);
        } else if (options?.chapterId) {
          const cid = Number(options.chapterId);
          const others = getLocalTests().filter((t) => Number(t.chapter_id) !== cid);
          setLocalTests([...others, ...tests]);
        }
        return tests;
      } else {
        console.warn('[ChapterTest] Server returned invalid chapter test shape, triggering Supabase fallback');
      }
    } else {
      console.info(`[ChapterTest] Server /tests returned ${res.status}, falling back to Supabase client.`);
    }
  } catch (err) {
    console.info('[ChapterTest] Server tests fetch notice, checking direct Supabase:', err);
  }

  // 2. Cloud Fallback: Direct Supabase PostgreSQL Query (Matches Sectional Test Architecture)
  if (!serverFetched && isSupabaseConfigured) {
    try {
      let query = supabase.from('chapter_tests').select('*');
      if (options?.chapterId) {
        query = query.eq('chapter_id', Number(options.chapterId));
      }
      if (options?.subject && options.subject !== 'All') {
        const normSub = options.subject.toLowerCase().trim();
        if (normSub === 'math' || normSub === 'mathematics') {
          query = query.in('subject', ['Math', 'Mathematics', 'math', 'mathematics']);
        } else {
          query = query.ilike('subject', options.subject.trim());
        }
      }
      if (options?.publishedOnly) {
        query = query.eq('published', true);
      }
      const { data, error } = await query
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const supabaseTests: ChapterTest[] = data.map((row: any) => ({
          id: Number(row.id),
          chapter_id: Number(row.chapter_id),
          title: String(row.title || ''),
          subject: String(row.subject || ''),
          chapter_name: row.chapter_name ? String(row.chapter_name) : undefined,
          total_questions: Number(row.total_questions || 0),
          total_marks: Number(row.total_marks || 50),
          duration_minutes: Number(row.duration_minutes || 20),
          negative_marking: Number(row.negative_marking ?? 0.25),
          published: Boolean(row.published !== false),
          sort_order: row.sort_order !== undefined && row.sort_order !== null ? Number(row.sort_order) : 0,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));

        if (!options?.chapterId && (!options?.subject || options.subject === 'All')) {
          setLocalTests(supabaseTests);
        } else if (options?.chapterId) {
          const cid = Number(options.chapterId);
          const others = getLocalTests().filter((t) => Number(t.chapter_id) !== cid);
          setLocalTests([...others, ...supabaseTests]);
        }
        return supabaseTests;
      }
    } catch (sbErr) {
      console.warn('[ChapterTest] Direct Supabase chapter tests query exception:', sbErr);
    }
  }

  // 3. Offline Device Cache Fallback
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

  // 1. Primary: Server API
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/tests/${numId}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: authHeaders
    });
    if (res.ok) {
      const json = await res.json();
      const testCandidate = json && json.success ? json.data : json;
      if (isValidChapterTestRecord(testCandidate)) {
        return {
          id: Number(testCandidate.id),
          chapter_id: Number(testCandidate.chapter_id),
          title: String(testCandidate.title || ''),
          subject: String(testCandidate.subject || ''),
          chapter_name: testCandidate.chapter_name ? String(testCandidate.chapter_name) : undefined,
          total_questions: Number(testCandidate.total_questions || 0),
          total_marks: Number(testCandidate.total_marks || 50),
          duration_minutes: Number(testCandidate.duration_minutes || 20),
          negative_marking: Number(testCandidate.negative_marking ?? 0.25),
          published: Boolean(testCandidate.published !== false),
          sort_order: testCandidate.sort_order !== undefined && testCandidate.sort_order !== null ? Number(testCandidate.sort_order) : 0,
          created_by: testCandidate.created_by,
          created_at: testCandidate.created_at || new Date().toISOString(),
          updated_at: testCandidate.updated_at || new Date().toISOString()
        };
      }
    }
  } catch {}

  // 2. Cloud Fallback: Direct Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapter_tests')
        .select('*')
        .eq('id', numId)
        .maybeSingle();
      if (!error && data) {
        return {
          id: Number(data.id),
          chapter_id: Number(data.chapter_id),
          title: String(data.title || ''),
          subject: String(data.subject || ''),
          chapter_name: data.chapter_name ? String(data.chapter_name) : undefined,
          total_questions: Number(data.total_questions || 0),
          total_marks: Number(data.total_marks || 50),
          duration_minutes: Number(data.duration_minutes || 20),
          negative_marking: Number(data.negative_marking ?? 0.25),
          published: Boolean(data.published !== false),
          sort_order: data.sort_order !== undefined && data.sort_order !== null ? Number(data.sort_order) : 0,
          created_by: data.created_by,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      }
    } catch {}
  }

  // 3. Local Cache Fallback
  const local = getLocalTests().find((t) => Number(t.id) === numId);
  return local || null;
}

/**
 * Save a chapter test and optionally its questions.
 * MANDATORY: Persists to the shared server database.
 * If server save fails, automatically falls back to direct Supabase client persistence.
 */
export async function saveChapterTest(
  payload: Partial<ChapterTest>,
  questions?: ChapterQuestion[]
): Promise<ChapterTest> {
  const headers = await getJsonAuthHeaders();
  const totalQuestions = Array.isArray(questions) ? questions.length : Number(payload.total_questions || 0);
  let savedTest: ChapterTest | null = null;
  let serverError: string | null = null;

  // 1. Primary: Server API
  try {
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

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        savedTest = json.data as ChapterTest;
      }
    } else {
      const errorText = await res.text();
      let errorMessage = `Server save failed (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error saving test';
  }

  // 2. Cloud Fallback: Direct Supabase Write
  if (!savedTest && isSupabaseConfigured) {
    try {
      if (payload.id) {
        const { data, error } = await supabase
          .from('chapter_tests')
          .update({
            chapter_id: Number(payload.chapter_id),
            title: String(payload.title || '').trim(),
            subject: String(payload.subject || '').trim(),
            total_questions: totalQuestions,
            total_marks: Number(payload.total_marks ?? 50),
            duration_minutes: Number(payload.duration_minutes ?? 20),
            negative_marking: Number(payload.negative_marking ?? 0.25),
            published: payload.published !== undefined ? Boolean(payload.published) : true,
            sort_order: payload.sort_order ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', Number(payload.id))
          .select()
          .single();
        if (!error && data) savedTest = data;
        else if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from('chapter_tests')
          .insert({
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
          .select()
          .single();
        if (!error && data) savedTest = data;
        else if (error) throw new Error(error.message);
      }
    } catch (sbErr: any) {
      console.warn('[ChapterTest] Direct Supabase save chapter test error:', sbErr);
      throw new Error(serverError || sbErr?.message || 'Failed to save test');
    }
  }

  if (!savedTest) {
    throw new Error(serverError || 'Failed to save test to server or database');
  }

  // If questions are provided, persist questions as well
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
  let serverDeleted = false;
  let serverError: string | null = null;

  try {
    const res = await fetch(`/api/chapter-tests/tests/${numId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    if (res.ok) {
      serverDeleted = true;
    } else {
      const errorText = await res.text();
      let errorMessage = `Failed to delete test (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error';
  }

  // Cloud Fallback: Direct Supabase
  if (!serverDeleted && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('chapter_tests').delete().eq('id', numId);
      if (!error) serverDeleted = true;
      else throw new Error(error.message);
    } catch (sbErr: any) {
      throw new Error(serverError || sbErr?.message || 'Failed to delete test');
    }
  }

  if (!serverDeleted) {
    throw new Error(serverError || 'Failed to delete test');
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
  let updated = false;
  let serverError: string | null = null;

  try {
    const res = await fetch(`/api/chapter-tests/tests/${numId}/publish`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ published })
    });

    if (res.ok) {
      updated = true;
    } else {
      const errorText = await res.text();
      let errorMessage = `Failed to toggle publish status (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error';
  }

  // Cloud Fallback: Direct Supabase
  if (!updated && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('chapter_tests')
        .update({ published, updated_at: new Date().toISOString() })
        .eq('id', numId);
      if (!error) updated = true;
      else throw new Error(error.message);
    } catch (sbErr: any) {
      throw new Error(serverError || sbErr?.message || 'Failed to toggle publish status');
    }
  }

  if (!updated) {
    throw new Error(serverError || 'Failed to toggle publish status');
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
  let serverPersisted = false;

  try {
    const res = await fetch('/api/chapter-tests/tests/reorder', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderedIds })
    });

    if (res.ok) {
      serverPersisted = true;
    }
  } catch {}

  // Cloud Fallback: Direct Supabase
  if (!serverPersisted && isSupabaseConfigured) {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('chapter_tests').update({ sort_order: index + 1 }).eq('id', id)
        )
      );
      serverPersisted = true;
    } catch {}
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
// CHAPTER QUESTIONS API (Authoritative Server Persistence with Direct Supabase Fallback)
// -----------------------------------------------------------------------------

export async function fetchChapterQuestions(testId: number | string): Promise<ChapterQuestion[]> {
  const numId = Number(testId);

  // 1. Primary: Server API
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/chapter-tests/tests/${numId}/questions?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: authHeaders
    });

    if (res.ok) {
      const json = await res.json();
      let candidate: any[] | null = null;
      if (json && json.success && Array.isArray(json.data)) {
        candidate = json.data;
      } else if (Array.isArray(json)) {
        candidate = json;
      }

      const isValid =
        candidate !== null &&
        (candidate.length === 0 ||
          candidate.every(
            (q: any) =>
              q &&
              typeof q === 'object' &&
              (q.question_text !== undefined || q.option_a !== undefined)
          ));

      if (isValid && candidate !== null) {
        const questions = candidate as ChapterQuestion[];
        const allQuestions = getLocalQuestions();
        allQuestions[numId] = questions;
        setLocalQuestions(allQuestions);
        try {
          localStorage.setItem(`ec_chapter_questions_${numId}`, JSON.stringify(questions));
        } catch {}
        return questions;
      } else {
        console.warn('[ChapterTest] Server returned invalid chapter questions shape, triggering Supabase fallback');
      }
    }
  } catch (err) {
    console.info('[ChapterTest] Questions fetch notice, checking direct Supabase:', err);
  }

  // 2. Cloud Fallback: Direct Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapter_questions')
        .select('*')
        .eq('test_id', numId)
        .order('question_order', { ascending: true });
      if (!error && Array.isArray(data)) {
        const questions = data as ChapterQuestion[];
        const allQuestions = getLocalQuestions();
        allQuestions[numId] = questions;
        setLocalQuestions(allQuestions);
        try {
          localStorage.setItem(`ec_chapter_questions_${numId}`, JSON.stringify(questions));
        } catch {}
        return questions;
      }
    } catch {}
  }

  // 3. Local Cache Fallback
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
  let serverSaved = false;
  let serverError: string | null = null;

  // 1. Primary: Server API
  try {
    const res = await fetch(`/api/chapter-tests/tests/${numId}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ questions: formattedQuestions })
    });

    if (res.ok) {
      serverSaved = true;
    } else {
      const errorText = await res.text();
      let errorMessage = `Failed to save questions on server (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      serverError = errorMessage;
    }
  } catch (err: any) {
    serverError = err?.message || 'Network error saving questions';
  }

  // 2. Cloud Fallback: Direct Supabase
  if (!serverSaved && isSupabaseConfigured) {
    try {
      await supabase.from('chapter_questions').delete().eq('test_id', numId);
      if (formattedQuestions.length > 0) {
        const { error: insErr } = await supabase.from('chapter_questions').insert(formattedQuestions);
        if (insErr) throw new Error(insErr.message);
      }
      await supabase
        .from('chapter_tests')
        .update({ total_questions: formattedQuestions.length, updated_at: new Date().toISOString() })
        .eq('id', numId);
      serverSaved = true;
    } catch (sbErr: any) {
      console.warn('[ChapterTest] Direct Supabase save questions error:', sbErr);
      throw new Error(serverError || sbErr?.message || 'Failed to save questions to database');
    }
  }

  if (!serverSaved) {
    throw new Error(serverError || 'Failed to save questions to server or database');
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
