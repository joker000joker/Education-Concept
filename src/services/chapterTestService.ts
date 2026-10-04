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

// Strict rule: No fake or demo data. Empty lists remain empty.
const INITIAL_DEMO_CHAPTERS: Chapter[] = [];
const INITIAL_DEMO_TESTS: ChapterTest[] = [];
const INITIAL_DEMO_QUESTIONS: Record<number, ChapterQuestion[]> = {};

// -----------------------------------------------------------------------------
// Local Storage Helpers
// -----------------------------------------------------------------------------

export const SUBJECT_SUB_CATEGORIES: Record<string, string[]> = {
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

function getLocalChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
    if (raw) {
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

function getLocalTests(): ChapterTest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTER_TESTS_KEY);
    if (raw) {
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
          published: item.published !== undefined ? Boolean(item.published) : true,
          sort_order: item.sort_order !== undefined && item.sort_order !== null ? Number(item.sort_order) : 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        })).sort((a, b) => {
          const orderA = a.sort_order ?? 0;
          const orderB = b.sort_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
      }
    }
  } catch (err) {
    console.warn('Failed to parse local chapter tests', err);
  }
  return [];
}

function setLocalTests(tests: ChapterTest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAPTER_TESTS_KEY, JSON.stringify(tests));
  } catch (err) {
    console.warn('Failed to save local chapter tests', err);
  }
}

function getLocalQuestions(): Record<number, ChapterQuestion[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAPTER_QUESTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
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
// CHAPTERS API
// -----------------------------------------------------------------------------

export async function fetchChapters(subject?: string, subCategory?: string): Promise<Chapter[]> {
  let chapters: Chapter[] = [];
  const normalizedSubject = subject ? subject.toLowerCase().trim() : '';

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('chapters').select('*').order('sort_order', { ascending: true });
      if (normalizedSubject) {
        query = query.ilike('subject', normalizedSubject);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        chapters = data as Chapter[];
        // Sync local cache
        const allLocal = getLocalChapters();
        const existingMap = new Map(allLocal.map((c) => [c.id, c]));
        chapters.forEach((c) => existingMap.set(c.id, c));
        setLocalChapters(Array.from(existingMap.values()));
      }
    } catch {
      // Fallback to local
    }
  }

  if (chapters.length === 0) {
    const all = getLocalChapters();
    chapters = normalizedSubject
      ? all.filter((c) => c.subject.toLowerCase().trim() === normalizedSubject)
      : all;
  }

  if (subCategory && subCategory.trim()) {
    const normSub = subCategory.toLowerCase().trim();
    chapters = chapters.filter(
      (c) => c.sub_category && c.sub_category.toLowerCase().trim() === normSub
    );
  }

  // Calculate test_count for each chapter
  const tests = await fetchChapterTests({ publishedOnly: false });
  const counts: Record<number, number> = {};
  tests.forEach((t) => {
    counts[t.chapter_id] = (counts[t.chapter_id] || 0) + 1;
  });

  return chapters.map((c) => ({
    ...c,
    test_count: counts[c.id] || 0
  }));
}

export async function saveChapter(payload: Partial<Chapter>): Promise<Chapter> {
  const timestamp = new Date().toISOString();
  let savedChapter: Chapter;

  if (payload.id) {
    // Update existing
    savedChapter = {
      id: Number(payload.id),
      subject: payload.subject || '',
      sub_category: payload.sub_category ? String(payload.sub_category) : undefined,
      name: payload.name || '',
      hindi_name: payload.hindi_name,
      description: payload.description,
      sort_order: payload.sort_order ?? 0,
      created_at: payload.created_at || timestamp,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      try {
        const updateData: any = {
          subject: savedChapter.subject,
          name: savedChapter.name,
          hindi_name: savedChapter.hindi_name,
          description: savedChapter.description,
          sort_order: savedChapter.sort_order,
          updated_at: timestamp
        };
        if (savedChapter.sub_category !== undefined) {
          updateData.sub_category = savedChapter.sub_category;
        }

        const { data, error } = await supabase
          .from('chapters')
          .update(updateData)
          .eq('id', savedChapter.id)
          .select()
          .single();
        if (!error && data) {
          savedChapter = data as Chapter;
        }
      } catch {}
    }
  } else {
    // Insert new
    const newId = Date.now();
    savedChapter = {
      id: newId,
      subject: payload.subject || '',
      sub_category: payload.sub_category ? String(payload.sub_category) : undefined,
      name: payload.name || '',
      hindi_name: payload.hindi_name,
      description: payload.description,
      sort_order: payload.sort_order ?? 0,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      try {
        const insertData: any = {
          subject: savedChapter.subject,
          name: savedChapter.name,
          hindi_name: savedChapter.hindi_name,
          description: savedChapter.description,
          sort_order: savedChapter.sort_order
        };
        if (savedChapter.sub_category !== undefined) {
          insertData.sub_category = savedChapter.sub_category;
        }

        const { data, error } = await supabase
          .from('chapters')
          .insert(insertData)
          .select()
          .single();
        if (!error && data) {
          savedChapter = data as Chapter;
        }
      } catch {}
    }
  }

  // Update local storage
  const localChapters = getLocalChapters();
  const idx = localChapters.findIndex((c) => c.id === savedChapter.id);
  if (idx >= 0) {
    localChapters[idx] = savedChapter;
  } else {
    localChapters.push(savedChapter);
  }
  setLocalChapters(localChapters);

  return savedChapter;
}

export async function deleteChapter(chapterId: number): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('chapters').delete().eq('id', chapterId);
    } catch {}
  }

  // Also delete from local storage
  const localChapters = getLocalChapters().filter((c) => c.id !== chapterId);
  setLocalChapters(localChapters);

  // Cascade delete tests belonging to this chapter locally
  const localTests = getLocalTests().filter((t) => t.chapter_id !== chapterId);
  setLocalTests(localTests);

  return true;
}

export async function reorderChapters(orderedIds: number[]): Promise<boolean> {
  const localChapters = getLocalChapters();
  const chapterMap = new Map(localChapters.map((c) => [c.id, c]));

  orderedIds.forEach((id, index) => {
    const chap = chapterMap.get(id);
    if (chap) {
      chap.sort_order = index + 1;
    }
  });

  setLocalChapters(Array.from(chapterMap.values()));

  if (isSupabaseConfigured) {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('chapters').update({ sort_order: index + 1 }).eq('id', id)
        )
      );
    } catch {}
  }

  return true;
}

// -----------------------------------------------------------------------------
// CHAPTER TESTS API
// -----------------------------------------------------------------------------

export async function fetchChapterTests(options?: {
  chapterId?: number;
  subject?: string;
  publishedOnly?: boolean;
}): Promise<ChapterTest[]> {
  let tests: ChapterTest[] = [];

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('chapter_tests').select('*').order('sort_order', { ascending: true });
      if (options?.chapterId) {
        query = query.eq('chapter_id', options.chapterId);
      }
      if (options?.subject) {
        query = query.ilike('subject', options.subject.trim());
      }
      if (options?.publishedOnly) {
        query = query.eq('published', true);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        tests = data as ChapterTest[];
        // Sync local cache
        const allLocal = getLocalTests();
        const map = new Map(allLocal.map((t) => [t.id, t]));
        tests.forEach((t) => map.set(t.id, t));
        setLocalTests(Array.from(map.values()));
      }
    } catch {}
  }

  if (tests.length === 0) {
    let all = getLocalTests();
    if (options?.chapterId) {
      all = all.filter((t) => t.chapter_id === options.chapterId);
    }
    if (options?.subject) {
      const sub = options.subject.toLowerCase().trim();
      all = all.filter((t) => t.subject.toLowerCase().trim() === sub);
    }
    if (options?.publishedOnly) {
      all = all.filter((t) => t.published);
    }
    tests = all;
  }

  return tests;
}

export async function fetchChapterTestById(id: number): Promise<ChapterTest | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapter_tests')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return data as ChapterTest;
      }
    } catch {}
  }

  const local = getLocalTests().find((t) => t.id === id);
  return local || null;
}

export async function saveChapterTest(
  payload: Partial<ChapterTest>,
  questions?: ChapterQuestion[]
): Promise<ChapterTest> {
  const timestamp = new Date().toISOString();
  const totalQuestions = questions ? questions.length : payload.total_questions || 0;
  let savedTest: ChapterTest;

  if (payload.id) {
    savedTest = {
      id: Number(payload.id),
      chapter_id: Number(payload.chapter_id),
      title: String(payload.title || '').trim(),
      subject: payload.subject || '',
      chapter_name: payload.chapter_name,
      total_questions: totalQuestions,
      total_marks: Number(payload.total_marks ?? 50),
      duration_minutes: Number(payload.duration_minutes ?? 20),
      negative_marking: Number(payload.negative_marking ?? 0.25),
      published: payload.published !== undefined ? Boolean(payload.published) : true,
      sort_order: payload.sort_order ?? 0,
      created_by: payload.created_by,
      created_at: payload.created_at || timestamp,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('chapter_tests')
          .update({
            chapter_id: savedTest.chapter_id,
            title: savedTest.title,
            subject: savedTest.subject,
            total_questions: savedTest.total_questions,
            total_marks: savedTest.total_marks,
            duration_minutes: savedTest.duration_minutes,
            negative_marking: savedTest.negative_marking,
            published: savedTest.published,
            sort_order: savedTest.sort_order,
            updated_at: timestamp
          })
          .eq('id', savedTest.id)
          .select()
          .single();
        if (!error && data) {
          savedTest = data as ChapterTest;
        }
      } catch {}
    }
  } else {
    const newId = Date.now();
    savedTest = {
      id: newId,
      chapter_id: Number(payload.chapter_id),
      title: String(payload.title || '').trim(),
      subject: payload.subject || '',
      chapter_name: payload.chapter_name,
      total_questions: totalQuestions,
      total_marks: Number(payload.total_marks ?? 50),
      duration_minutes: Number(payload.duration_minutes ?? 20),
      negative_marking: Number(payload.negative_marking ?? 0.25),
      published: payload.published !== undefined ? Boolean(payload.published) : true,
      sort_order: payload.sort_order ?? 0,
      created_by: payload.created_by,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('chapter_tests')
          .insert({
            chapter_id: savedTest.chapter_id,
            title: savedTest.title,
            subject: savedTest.subject,
            total_questions: savedTest.total_questions,
            total_marks: savedTest.total_marks,
            duration_minutes: savedTest.duration_minutes,
            negative_marking: savedTest.negative_marking,
            published: savedTest.published,
            sort_order: savedTest.sort_order
          })
          .select()
          .single();
        if (!error && data) {
          savedTest = data as ChapterTest;
        }
      } catch {}
    }
  }

  // Update local storage
  const localTests = getLocalTests();
  const idx = localTests.findIndex((t) => t.id === savedTest.id);
  if (idx >= 0) {
    localTests[idx] = savedTest;
  } else {
    localTests.push(savedTest);
  }
  setLocalTests(localTests);

  // If questions are provided, save questions as well
  if (questions && questions.length > 0) {
    await saveChapterQuestions(savedTest.id, questions);
  }

  return savedTest;
}

export async function deleteChapterTest(testId: number): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('chapter_tests').delete().eq('id', testId);
    } catch {}
  }

  const localTests = getLocalTests().filter((t) => t.id !== testId);
  setLocalTests(localTests);

  const localQuestions = getLocalQuestions();
  delete localQuestions[testId];
  setLocalQuestions(localQuestions);

  return true;
}

export async function togglePublishChapterTest(testId: number, published: boolean): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('chapter_tests').update({ published }).eq('id', testId);
    } catch {}
  }

  const localTests = getLocalTests();
  const test = localTests.find((t) => t.id === testId);
  if (test) {
    test.published = published;
    setLocalTests(localTests);
  }
  return true;
}

export async function reorderChapterTests(orderedIds: number[]): Promise<boolean> {
  const localTests = getLocalTests();
  const map = new Map(localTests.map((t) => [t.id, t]));

  orderedIds.forEach((id, index) => {
    const t = map.get(id);
    if (t) {
      t.sort_order = index + 1;
    }
  });

  setLocalTests(Array.from(map.values()));

  if (isSupabaseConfigured) {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('chapter_tests').update({ sort_order: index + 1 }).eq('id', id)
        )
      );
    } catch {}
  }

  return true;
}

// -----------------------------------------------------------------------------
// CHAPTER QUESTIONS API
// -----------------------------------------------------------------------------

export async function fetchChapterQuestions(testId: number): Promise<ChapterQuestion[]> {
  let questions: ChapterQuestion[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapter_questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        questions = data as ChapterQuestion[];
        // Sync local cache
        const allQuestions = getLocalQuestions();
        allQuestions[testId] = questions;
        setLocalQuestions(allQuestions);
        return questions;
      }
    } catch {}
  }

  const localQuestions = getLocalQuestions();
  return localQuestions[testId] || [];
}

export async function saveChapterQuestions(
  testId: number,
  questions: ChapterQuestion[]
): Promise<ChapterQuestion[]> {
  const formattedQuestions: ChapterQuestion[] = questions.map((q, idx) => ({
    test_id: testId,
    question_order: q.question_order || idx + 1,
    question_text: q.question_text.trim(),
    option_a: q.option_a.trim(),
    option_b: q.option_b.trim(),
    option_c: q.option_c.trim(),
    option_d: q.option_d.trim(),
    correct_option: q.correct_option.trim().toUpperCase(),
    explanation: q.explanation ? q.explanation.trim() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  if (isSupabaseConfigured) {
    try {
      // Delete old questions
      await supabase.from('chapter_questions').delete().eq('test_id', testId);
      // Insert new questions
      const { data, error } = await supabase
        .from('chapter_questions')
        .insert(formattedQuestions)
        .select();
      if (!error && Array.isArray(data)) {
        // Also update total_questions in chapter_tests
        await supabase
          .from('chapter_tests')
          .update({ total_questions: formattedQuestions.length })
          .eq('id', testId);
      }
    } catch {}
  }

  // Update local storage
  const localQuestions = getLocalQuestions();
  localQuestions[testId] = formattedQuestions;
  setLocalQuestions(localQuestions);

  // Update test question count locally
  const localTests = getLocalTests();
  const test = localTests.find((t) => t.id === testId);
  if (test) {
    test.total_questions = formattedQuestions.length;
    setLocalTests(localTests);
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

export async function syncLocalChapterDataWithServer(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const chapters = await fetchChapters();
    const tests = await fetchChapterTests();
    console.log(`Synced ${chapters.length} chapters and ${tests.length} tests with server.`);
  } catch (err) {
    console.warn('Sync failed', err);
  }
}
