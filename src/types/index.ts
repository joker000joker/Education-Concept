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
