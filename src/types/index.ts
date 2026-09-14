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
