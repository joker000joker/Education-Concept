export interface Profile {
  id: string;
  mobile: string | null;
  full_name?: string | null;
  role: 'admin' | 'user' | string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  note_count?: number;
}

export interface Note {
  id: number;
  title: string;
  description: string | null;
  category_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  published: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at?: string;
  // Joined or populated category
  category?: Category;
}

export interface CategoryMeta {
  id: number;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface PaidEbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  cover_image_path: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
}

export interface FreeEbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  cover_image_path: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
}

export interface CurrentAffair {
  id: number;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  published: boolean;
  display_order: number;
  created_at: string;
}

export interface ExamPattern {
  id: number;
  exam_category: string;
  exam_name: string;
  pattern_file_path: string | null;
  syllabus_file_path: string | null;
  published: boolean;
  created_at: string;
}

export interface StudyResource {
  id: number;
  title: string;
  category: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  published: boolean;
  display_order: number;
  created_at: string;
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  subject: string | null;
  chapter: string | null;
  difficulty: string | null;
  created_at: string;
}

export interface Test {
  id: number;
  title: string;
  test_type: string;
  subject: string | null;
  chapter: string | null;
  exam_name: string | null;
  duration_minutes: number | null;
  is_free: boolean;
  price: number | null;
  published: boolean;
  scheduled_time: string | null;
  created_at: string;
}

export interface Banner {
  id: number;
  section: string;
  image_path: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  title?: string | null;
}

export interface AppSetting {
  key: string;
  value: string;
}

export type RecommendationContentType = 
  | 'notes' 
  | 'paid_ebooks' 
  | 'free_ebooks' 
  | 'current_affairs' 
  | 'exam_patterns' 
  | 'study_resources';

export interface ResolvedRecommendationItem {
  id: number;
  title: string;
  description?: string | null;
  category?: string;
  price?: number;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  cover_image_path?: string | null;
  published?: boolean;
  destination_url: string;
  pattern_file_path?: string | null;
  syllabus_file_path?: string | null;
  exam_category?: string;
}

export interface TopRecommendation {
  id: number;
  content_type: RecommendationContentType | string;
  content_id: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  resolved_item?: ResolvedRecommendationItem | null;
  is_missing?: boolean;
}

export type SectionalSubject =
  | 'Mathematics'
  | 'Reasoning'
  | 'English'
  | 'Hindi'
  | 'Current Affairs'
  | 'History'
  | 'Geography'
  | 'Polity'
  | 'Economics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology';

export interface SectionalTest {
  id: number;
  title: string;
  subject: SectionalSubject | string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: number;
  published: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  questions?: SectionalQuestion[];
}

export interface SectionalQuestion {
  id?: number;
  test_id?: number;
  question_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TestAttemptResult {
  testId: number;
  testTitle: string;
  subject: string;
  totalQuestions: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  negativeMarksTotal?: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracy: number;
  timeTakenSeconds: number;
  userAnswers: Record<number, string>;
  submittedAt: string;
}

export interface StoredQuestionAnswer {
  questionId?: number;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedOption: string | null;
  correctOption: string;
  status: 'correct' | 'incorrect' | 'unattempted';
  marksAwarded: number;
  explanation?: string | null;
}

export interface SectionalTestResult {
  id?: number | string;
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
  answers: {
    questions: StoredQuestionAnswer[];
    userAnswers: Record<number, string>;
  };
  completed_at: string;
  created_at?: string;
  updated_at?: string;
  // UI helper fields
  test_title?: string;
  subject?: string;
  percentage?: number;
}

