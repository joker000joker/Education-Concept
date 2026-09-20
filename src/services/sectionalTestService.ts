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

// Initial curated sample tests so the app has immediate working tests
const INITIAL_DEMO_TESTS: SectionalTest[] = [
  {
    id: 101,
    title: 'Mathematics Sectional Test 01 - Arithmetic & Number Systems',
    subject: 'Mathematics',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 15,
    negative_marking: 0.25,
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 102,
    title: 'Reasoning Sectional Test 01 - Verbal & Logical Syllogisms',
    subject: 'Reasoning',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 15,
    negative_marking: 0.25,
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 103,
    title: 'History Sectional Test 01 - Modern Indian Freedom Struggle',
    subject: 'History',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 12,
    negative_marking: 0.25,
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: 104,
    title: 'Polity Sectional Test 01 - Constitution & Fundamental Rights',
    subject: 'Polity',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 12,
    negative_marking: 0.25,
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: 105,
    title: 'Physics Sectional Test 01 - Mechanics, Waves & Optics',
    subject: 'Physics',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 15,
    negative_marking: 0.25,
    published: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 106,
    title: 'Current Affairs Sectional Test 01 - National & International Events',
    subject: 'Current Affairs',
    total_questions: 5,
    total_marks: 50,
    duration_minutes: 10,
    negative_marking: 0.25,
    published: true,
    created_at: new Date().toISOString(),
  }
];

const INITIAL_DEMO_QUESTIONS: Record<number, SectionalQuestion[]> = {
  101: [
    {
      id: 1001,
      test_id: 101,
      question_order: 1,
      question_text: 'यदि किसी संख्या के 40% का 25% 60 है, तो वह संख्या क्या है?',
      option_a: '500',
      option_b: '600',
      option_c: '400',
      option_d: '800',
      correct_option: 'B',
      explanation: 'संख्या x मानिए: x × 0.40 × 0.25 = 60 => x × 0.10 = 60 => x = 600।'
    },
    {
      id: 1002,
      test_id: 101,
      question_order: 2,
      question_text: 'दो संख्याओं का LCM 120 तथा HCF 6 है। यदि एक संख्या 24 है तो दूसरी संख्या ज्ञात कीजिए।',
      option_a: '30',
      option_b: '36',
      option_c: '42',
      option_d: '28',
      correct_option: 'A',
      explanation: 'पहला पद × दूसरा पद = LCM × HCF => 24 × Y = 120 × 6 => Y = 720 / 24 = 30।'
    },
    {
      id: 1003,
      test_id: 101,
      question_order: 3,
      question_text: 'एक ट्रेन 72 किमी/घंटा की गति से चल रही है। 200 मीटर लंबे पुल को पार करने में यदि 25 सेकंड लगते हैं, तो ट्रेन की लंबाई कितनी है?',
      option_a: '250 मीटर',
      option_b: '300 मीटर',
      option_c: '350 मीटर',
      option_d: '400 मीटर',
      correct_option: 'B',
      explanation: 'गति = 72 × (5/18) = 20 मी/से। कुल दूरी = गति × समय = 20 × 25 = 500 मी। ट्रेन की लंबाई = 500 - 200 = 300 मीटर।'
    },
    {
      id: 1004,
      test_id: 101,
      question_order: 4,
      question_text: 'A किसी कार्य को 12 दिनों में और B उसी कार्य को 18 दिनों में पूरा कर सकता है। दोनों मिलकर उस कार्य को कितने दिनों में पूरा करेंगे?',
      option_a: '7.2 दिन',
      option_b: '8 दिन',
      option_c: '6.5 दिन',
      option_d: '7 दिन',
      correct_option: 'A',
      explanation: 'कुल समय = (12 × 18) / (12 + 18) = 216 / 30 = 7.2 दिन।'
    },
    {
      id: 1005,
      test_id: 101,
      question_order: 5,
      question_text: '₹8,000 की राशि पर 10% वार्षिक दर से 2 वर्ष का साधारण ब्याज कितना होगा?',
      option_a: '₹1,200',
      option_b: '₹1,400',
      option_c: '₹1,600',
      option_d: '₹1,800',
      correct_option: 'C',
      explanation: 'SI = (P × R × T) / 100 = (8000 × 10 × 2) / 100 = ₹1,600।'
    }
  ],
  102: [
    {
      id: 1006,
      test_id: 102,
      question_order: 1,
      question_text: 'निम्नलिखित श्रृंखला में अगला पद क्या होगा?\n3, 7, 15, 31, 63, ?',
      option_a: '125',
      option_b: '127',
      option_c: '128',
      option_d: '130',
      correct_option: 'B',
      explanation: 'पैटर्न: प्रत्येक संख्या (पिछली संख्या × 2 + 1) है। 63 × 2 + 1 = 126 + 1 = 127।'
    },
    {
      id: 1007,
      test_id: 102,
      question_order: 2,
      question_text: 'यदि "TEACHER" को "VGCEJGT" लिखा जाता है, तो "STUDENT" को उसी कोड में कैसे लिखा जाएगा?',
      option_a: 'UVWFGPV',
      option_b: 'UVWGPFV',
      option_c: 'VWWGPGV',
      option_d: 'UVWFHPW',
      correct_option: 'A',
      explanation: 'प्रत्येक अक्षर में +2 जोड़ा गया है: S+2=U, T+2=V, U+2=W, D+2=F, E+2=G, N+2=P, T+2=V => UVWFGPV।'
    },
    {
      id: 1008,
      test_id: 102,
      question_order: 3,
      question_text: 'एक व्यक्ति उत्तर की ओर 10 किमी चलता है, फिर दाएं मुड़कर 5 किमी चलता है, और फिर दाएं मुड़कर 10 किमी चलता है। अब वह अपने प्रारंभिक बिंदु से किस दिशा में और कितनी दूरी पर है?',
      option_a: 'पूर्व, 5 किमी',
      option_b: 'पश्चिम, 5 किमी',
      option_c: 'उत्तर, 10 किमी',
      option_d: 'दक्षिण, 5 किमी',
      correct_option: 'A',
      explanation: 'व्यक्ति प्रारंभिक बिंदु के ठीक पूर्व दिशा में 5 किमी की दूरी पर है।'
    },
    {
      id: 1009,
      test_id: 102,
      question_order: 4,
      question_text: 'कथन:\n1. सभी पेन किताबें हैं।\n2. सभी किताबें कापियां हैं।\nनिष्कर्ष:\nI. सभी पेन कापियां हैं।\nII. कुछ कापियां पेन हैं।',
      option_a: 'केवल निष्कर्ष I सही है',
      option_b: 'केवल निष्कर्ष II सही है',
      option_c: 'दोनों निष्कर्ष I और II सही हैं',
      option_d: 'कोई भी निष्कर्ष सही नहीं है',
      correct_option: 'C',
      explanation: 'दोनों निष्कर्ष निश्चित रूप से सत्य हैं।'
    },
    {
      id: 1010,
      test_id: 102,
      question_order: 5,
      question_text: 'A, B का भाई है। C, A की मां है। D, C का पिता है। B का D से क्या संबंध है?',
      option_a: 'पोता / नाती',
      option_b: 'पुत्र',
      option_c: 'भाई',
      option_d: 'दादा',
      correct_option: 'A',
      explanation: 'C, B की भी मां है और D, C का पिता है, इसलिए B, D का नाती / पोता है।'
    }
  ],
  103: [
    {
      id: 1011,
      test_id: 103,
      question_order: 1,
      question_text: '1857 के प्रथम स्वतंत्रता संग्राम की शुरुआत किस छावनी से हुई थी?',
      option_a: 'झांसी',
      option_b: 'मेरठ',
      option_c: 'कानपुर',
      option_d: 'लखनऊ',
      correct_option: 'B',
      explanation: '10 मई 1857 को मेरठ छावनी से स्वतंत्रता संग्राम का खुला विद्रोह शुरू हुआ था।'
    },
    {
      id: 1012,
      test_id: 103,
      question_order: 2,
      question_text: 'जलियांवाला बाग हत्याकांड किस वर्ष घटित हुआ था?',
      option_a: '1917',
      option_b: '1918',
      option_c: '1919',
      option_d: '1920',
      correct_option: 'C',
      explanation: 'जलियांवाला बाग नरसंहार 13 अप्रैल 1919 को अमृतसर में बैसाखी के दिन हुआ था।'
    },
    {
      id: 1013,
      test_id: 103,
      question_order: 3,
      question_text: 'भारतीय राष्ट्रीय कांग्रेस की स्थापना 1885 में किसके द्वारा की गई थी?',
      option_a: 'दादाभाई नौरोजी',
      option_b: 'ए. ओ. ह्यूम (A. O. Hume)',
      option_c: 'व्योमेश चंद्र बनर्जी',
      option_d: 'गोपाल कृष्ण गोखले',
      correct_option: 'B',
      explanation: 'सेवानिवृत्त ब्रिटिश सिविल सेवक एलन ऑक्टेवियन ह्यूम ने कांग्रेस की स्थापना में प्रमुख भूमिका निभाई थी।'
    },
    {
      id: 1014,
      test_id: 103,
      question_order: 4,
      question_text: 'महात्मा गांधी ने किस आंदोलन के दौरान "करो या मरो" का नारा दिया था?',
      option_a: 'असहयोग आंदोलन (1920)',
      option_b: 'सविनय अवज्ञा आंदोलन (1930)',
      option_c: 'भारत छोड़ो आंदोलन (1942)',
      option_d: 'चंपारण सत्याग्रह (1917)',
      correct_option: 'C',
      explanation: '8 अगस्त 1942 को बॉम्बे में भारत छोड़ो आंदोलन के प्रस्ताव के समय गांधीजी ने "करो या मरो" का ऐतिहासिक नारा दिया था।'
    },
    {
      id: 1015,
      test_id: 103,
      question_order: 5,
      question_text: 'स्वराज पार्टी की स्थापना 1923 में किसने की थी?',
      option_a: 'सी. आर. दास और मोतीलाल नेहरू',
      option_b: 'जवाहरलाल नेहरू और सुभाष चंद्र बोस',
      option_c: 'भगत सिंह और चंद्रशेखर आजाद',
      option_d: 'लाला लाजपत राय और बिपिन चंद्र पाल',
      correct_option: 'A',
      explanation: 'चित्तरंजन दास (अध्यक्ष) और मोतीलाल नेहरू (सचिव) ने 1 जनवरी 1923 को स्वराज पार्टी की नींव रखी थी।'
    }
  ]
};

// Local storage helpers
function getLocalTests(): SectionalTest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TESTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(INITIAL_DEMO_TESTS));
      return INITIAL_DEMO_TESTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_DEMO_TESTS;
  }
}

function setLocalTests(tests: SectionalTest[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(tests));
  } catch (err) {
    console.warn('Failed to save tests to localStorage', err);
  }
}

function getLocalQuestions(testId: number): SectionalQuestion[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    const map = raw ? JSON.parse(raw) : INITIAL_DEMO_QUESTIONS;
    return map[testId] || INITIAL_DEMO_QUESTIONS[testId] || [];
  } catch (err) {
    return INITIAL_DEMO_QUESTIONS[testId] || [];
  }
}

function setLocalQuestions(testId: number, questions: SectionalQuestion[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    const map = raw ? JSON.parse(raw) : { ...INITIAL_DEMO_QUESTIONS };
    map[testId] = questions;
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(map));
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
  } catch {}
}

/**
 * Fetch sectional tests from Supabase with fallback to local store.
 */
export async function fetchSectionalTests(options?: {
  subject?: string;
  publishedOnly?: boolean;
}): Promise<SectionalTest[]> {
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
      if (!error && data && data.length > 0) {
        return data as SectionalTest[];
      }
      if (error) {
        // Table not created or permission error -> fallback
        console.info('[SectionalTest] Supabase query notice:', error.message);
      }
    } catch (err) {
      console.warn('[SectionalTest] Falling back to local storage cache:', err);
    }
  }

  // Fallback to local storage cache
  let local = getLocalTests();
  if (options?.publishedOnly) {
    local = local.filter((t) => t.published);
  }
  if (options?.subject && options.subject !== 'All') {
    local = local.filter(
      (t) => t.subject.toLowerCase() === options.subject?.toLowerCase()
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
  const local = getLocalTests();
  return local.find((t) => t.id === numId) || null;
}

/**
 * Fetch questions for a test
 */
export async function fetchSectionalQuestions(
  testId: number | string
): Promise<SectionalQuestion[]> {
  const numId = Number(testId);
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
  return getLocalQuestions(numId);
}

/**
 * Create or update a sectional test and its questions.
 */
export async function saveSectionalTest(
  testData: Partial<SectionalTest>,
  questions: SectionalQuestion[]
): Promise<{ success: boolean; testId: number; error?: string }> {
  const totalQuestions = questions.length;
  const isEditing = Boolean(testData.id);

  if (isSupabaseConfigured) {
    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('sectional_tests')
          .update({
            title: testData.title,
            subject: testData.subject,
            total_questions: totalQuestions,
            total_marks: testData.total_marks,
            duration_minutes: testData.duration_minutes,
            negative_marking: testData.negative_marking,
            published: testData.published,
            updated_at: new Date().toISOString()
          })
          .eq('id', testData.id);

        if (!updateError) {
          // Delete old questions and re-insert
          await supabase.from('sectional_questions').delete().eq('test_id', testData.id);
          const questionsPayload = questions.map((q, idx) => ({
            test_id: testData.id,
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

          // Update local cache also
          updateLocalTest(testData as SectionalTest, questions);
          return { success: true, testId: testData.id! };
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('sectional_tests')
          .insert({
            title: testData.title,
            subject: testData.subject,
            total_questions: totalQuestions,
            total_marks: testData.total_marks,
            duration_minutes: testData.duration_minutes,
            negative_marking: testData.negative_marking,
            published: testData.published ?? true
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

          // Update local cache
          const createdTest: SectionalTest = {
            ...(inserted as SectionalTest),
            total_questions: totalQuestions
          };
          updateLocalTest(createdTest, questions);
          return { success: true, testId: newId };
        }
      }
    } catch (err: any) {
      console.warn('[SectionalTest] Supabase save failed, storing locally:', err?.message || err);
    }
  }

  // Local fallback save
  const targetId = testData.id || Date.now();
  const testObj: SectionalTest = {
    id: targetId,
    title: testData.title || 'Untitled Test',
    subject: testData.subject || 'Mathematics',
    total_questions: totalQuestions,
    total_marks: testData.total_marks || 50,
    duration_minutes: testData.duration_minutes || 20,
    negative_marking: testData.negative_marking ?? 0.25,
    published: testData.published ?? true,
    created_at: testData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  updateLocalTest(testObj, questions);
  return { success: true, testId: targetId };
}

function updateLocalTest(test: SectionalTest, questions: SectionalQuestion[]) {
  const current = getLocalTests();
  const existingIdx = current.findIndex((t) => t.id === test.id);
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
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('sectional_tests').delete().eq('id', id);
      if (!error) {
        removeLocalTest(id);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('[SectionalTest] Supabase delete error:', err);
    }
  }
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
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('sectional_tests')
        .update({ published, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) {
        const tests = getLocalTests().map((t) => (t.id === id ? { ...t, published } : t));
        setLocalTests(tests);
        return { success: true };
      }
    } catch (err) {}
  }
  const tests = getLocalTests().map((t) => (t.id === id ? { ...t, published } : t));
  setLocalTests(tests);
  return { success: true };
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

