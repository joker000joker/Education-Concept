import { supabase } from '../lib/supabase';
import { 
  TopRecommendation, 
  ResolvedRecommendationItem, 
  RecommendationContentType 
} from '../types';

export interface ContentTypeOption {
  id: RecommendationContentType;
  label: string;
  hasCategories: boolean;
  categoryLabel?: string;
  defaultCategories?: { value: string; label: string }[];
}

export const SUPPORTED_CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: 'notes',
    label: 'Notes',
    hasCategories: true,
    categoryLabel: 'Subject / Category',
  },
  {
    id: 'paid_ebooks',
    label: 'Paid E-Books',
    hasCategories: true,
    categoryLabel: 'Category',
    defaultCategories: [
      { value: 'ssc', label: 'SSC E-BOOKS' },
      { value: 'railways', label: 'RAILWAYS E-BOOKS' },
      { value: 'state-exams', label: 'STATE EXAMS E-BOOKS' },
    ],
  },
  {
    id: 'free_ebooks',
    label: 'Free E-Books',
    hasCategories: true,
    categoryLabel: 'Category',
    defaultCategories: [
      { value: 'ssc', label: 'SSC E-BOOKS' },
      { value: 'railways', label: 'RAILWAYS E-BOOKS' },
      { value: 'state-exams', label: 'STATE EXAMS E-BOOKS' },
    ],
  },
  {
    id: 'current_affairs',
    label: 'Current Affairs',
    hasCategories: false,
  },
  {
    id: 'exam_patterns',
    label: 'Exam Pattern & Syllabus',
    hasCategories: true,
    categoryLabel: 'Exam Category',
    defaultCategories: [
      { value: 'SSC', label: 'SSC' },
      { value: 'Railway', label: 'Railway' },
      { value: 'Bihar', label: 'Bihar' },
      { value: 'UP', label: 'UP' },
    ],
  },
  {
    id: 'study_resources',
    label: 'Study Resources',
    hasCategories: true,
    categoryLabel: 'Resource Type',
    defaultCategories: [
      { value: 'Previous Year Papers', label: 'Previous Year Papers' },
      { value: 'Practice Sets', label: 'Practice Sets' },
      { value: 'Formula & Short Tricks', label: 'Formula & Short Tricks' },
      { value: 'One-Liners', label: 'One-Liners' },
    ],
  },
];

// Resolves destination URL based on content type and item data
export function getDestinationUrl(contentType: string, item: any): string {
  switch (contentType) {
    case 'notes':
      return `/notes/${item.id}`;
    case 'paid_ebooks':
      return `/paid-ebooks/${encodeURIComponent(item.category || 'ssc')}`;
    case 'free_ebooks':
      return `/free-ebooks/${encodeURIComponent(item.category || 'ssc')}`;
    case 'current_affairs':
      return '/current-affairs';
    case 'exam_patterns': {
      const cat = (item.exam_category || 'SSC').toLowerCase();
      const routeCat = cat === 'ssc' ? 'ssc' : cat === 'railway' ? 'railway' : 'state-exams';
      return `/syllabus/${routeCat}/${encodeURIComponent(item.exam_name || '')}`;
    }
    case 'study_resources': {
      const raw = (item.category || '').toLowerCase();
      let slug = 'pyp';
      if (raw.includes('previous') || raw === 'pyp') slug = 'pyp';
      else if (raw.includes('practice')) slug = 'practice-sets';
      else if (raw.includes('formula') || raw.includes('trick')) slug = 'formula';
      else if (raw.includes('one-liner') || raw.includes('oneliner')) slug = 'one-liners';
      return `/resources/${slug}`;
    }
    default:
      return '/';
  }
}

// Batch resolver for recommendation items to prevent N+1 queries
export async function resolveRecommendations(rawRecs: any[]): Promise<TopRecommendation[]> {
  if (!rawRecs || rawRecs.length === 0) return [];

  // Group IDs by content type
  const idGroups: Record<string, number[]> = {
    notes: [],
    paid_ebooks: [],
    free_ebooks: [],
    current_affairs: [],
    exam_patterns: [],
    study_resources: [],
  };

  rawRecs.forEach((r) => {
    if (idGroups[r.content_type]) {
      idGroups[r.content_type].push(Number(r.content_id));
    }
  });

  // Fetch in parallel for each table
  const [
    notesRes,
    paidEbooksRes,
    freeEbooksRes,
    currentAffairsRes,
    examPatternsRes,
    studyResourcesRes,
  ] = await Promise.all([
    idGroups.notes.length > 0
      ? supabase
          .from('notes')
          .select('id, title, description, category_id, file_path, file_name, file_size, published, category:categories(name)')
          .in('id', idGroups.notes)
      : Promise.resolve({ data: [] }),
    idGroups.paid_ebooks.length > 0
      ? supabase
          .from('paid_ebooks')
          .select('id, title, description, category, price, file_path, file_name, file_size, cover_image_path, published')
          .in('id', idGroups.paid_ebooks)
      : Promise.resolve({ data: [] }),
    idGroups.free_ebooks.length > 0
      ? supabase
          .from('free_ebooks')
          .select('id, title, description, category, file_path, file_name, file_size, cover_image_path, published')
          .in('id', idGroups.free_ebooks)
      : Promise.resolve({ data: [] }),
    idGroups.current_affairs.length > 0
      ? supabase
          .from('current_affairs')
          .select('id, title, file_path, file_name, file_size, published, created_at')
          .in('id', idGroups.current_affairs)
      : Promise.resolve({ data: [] }),
    idGroups.exam_patterns.length > 0
      ? supabase
          .from('exam_patterns')
          .select('id, exam_category, exam_name, pattern_file_path, syllabus_file_path, published')
          .in('id', idGroups.exam_patterns)
      : Promise.resolve({ data: [] }),
    idGroups.study_resources.length > 0
      ? supabase
          .from('study_resources')
          .select('id, title, category, file_path, file_name, file_size, published')
          .in('id', idGroups.study_resources)
      : Promise.resolve({ data: [] }),
  ]);

  // Index by content_type + id
  const itemMap = new Map<string, ResolvedRecommendationItem>();

  (notesRes.data || []).forEach((n: any) => {
    itemMap.set(`notes_${n.id}`, {
      id: n.id,
      title: n.title,
      description: n.description,
      category: n.category?.name || 'General Notes',
      file_path: n.file_path,
      file_name: n.file_name,
      file_size: n.file_size,
      published: n.published,
      destination_url: getDestinationUrl('notes', n),
    });
  });

  (paidEbooksRes.data || []).forEach((b: any) => {
    itemMap.set(`paid_ebooks_${b.id}`, {
      id: b.id,
      title: b.title,
      description: b.description,
      category: b.category,
      price: b.price,
      file_path: b.file_path,
      file_name: b.file_name,
      file_size: b.file_size,
      cover_image_path: b.cover_image_path,
      published: b.published,
      destination_url: getDestinationUrl('paid_ebooks', b),
    });
  });

  (freeEbooksRes.data || []).forEach((b: any) => {
    itemMap.set(`free_ebooks_${b.id}`, {
      id: b.id,
      title: b.title,
      description: b.description,
      category: b.category,
      price: 0,
      file_path: b.file_path,
      file_name: b.file_name,
      file_size: b.file_size,
      cover_image_path: b.cover_image_path,
      published: b.published,
      destination_url: getDestinationUrl('free_ebooks', b),
    });
  });

  (currentAffairsRes.data || []).forEach((ca: any) => {
    itemMap.set(`current_affairs_${ca.id}`, {
      id: ca.id,
      title: ca.title,
      category: 'Current Affairs',
      file_path: ca.file_path,
      file_name: ca.file_name,
      file_size: ca.file_size,
      published: ca.published,
      destination_url: getDestinationUrl('current_affairs', ca),
    });
  });

  (examPatternsRes.data || []).forEach((ep: any) => {
    itemMap.set(`exam_patterns_${ep.id}`, {
      id: ep.id,
      title: ep.exam_name,
      category: ep.exam_category,
      exam_category: ep.exam_category,
      pattern_file_path: ep.pattern_file_path,
      syllabus_file_path: ep.syllabus_file_path,
      published: ep.published,
      destination_url: getDestinationUrl('exam_patterns', ep),
    });
  });

  (studyResourcesRes.data || []).forEach((sr: any) => {
    itemMap.set(`study_resources_${sr.id}`, {
      id: sr.id,
      title: sr.title,
      category: sr.category,
      file_path: sr.file_path,
      file_name: sr.file_name,
      file_size: sr.file_size,
      published: sr.published,
      destination_url: getDestinationUrl('study_resources', sr),
    });
  });

  return rawRecs.map((r) => {
    const key = `${r.content_type}_${r.content_id}`;
    const resolved = itemMap.get(key) || null;
    return {
      id: r.id,
      content_type: r.content_type,
      content_id: Number(r.content_id),
      display_order: r.display_order ?? 0,
      is_active: r.is_active ?? true,
      created_at: r.created_at,
      updated_at: r.updated_at,
      resolved_item: resolved,
      is_missing: !resolved,
    };
  });
}

// Fetch all recommendations for Admin Panel
export async function fetchAdminRecommendations(): Promise<TopRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from('top_recommendations')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST303' || String(error.message).includes('JWT issued at future')) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryRes = await supabase
          .from('top_recommendations')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (!retryRes.error && retryRes.data) {
          return resolveRecommendations(retryRes.data);
        }
      }
      console.warn('Notice: error fetching admin top_recommendations:', error.message || error);
      return [];
    }

    return resolveRecommendations(data || []);
  } catch (err) {
    console.warn('Notice: exception in fetchAdminRecommendations:', err);
    return [];
  }
}

// Fetch only active published recommendations for student Homepage
export async function fetchPublicRecommendations(): Promise<TopRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from('top_recommendations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      // If a transient clock skew (PGRST303) occurs, wait a second and retry once
      if (error.code === 'PGRST303' || String(error.message).includes('JWT issued at future')) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryRes = await supabase
          .from('top_recommendations')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!retryRes.error && retryRes.data) {
          const resolved = await resolveRecommendations(retryRes.data);
          return resolved.filter(
            (r) => r.resolved_item && r.resolved_item.published !== false
          );
        }
      }

      console.warn('Notice: could not load public top_recommendations:', error.message || error);
      return [];
    }

    const resolved = await resolveRecommendations(data || []);

    // Filter out missing items or items whose original content is not published
    return resolved.filter(
      (r) => r.resolved_item && r.resolved_item.published !== false
    );
  } catch (err) {
    console.warn('Notice: exception in fetchPublicRecommendations:', err);
    return [];
  }
}

// Fetch existing uploaded content from the original table for Admin selection
export async function fetchExistingContentItems(
  contentType: RecommendationContentType,
  options: {
    categoryFilter?: string;
    searchTerm?: string;
  } = {}
): Promise<{ id: number; title: string; subtitle?: string; category?: string; published?: boolean }[]> {
  const { categoryFilter, searchTerm } = options;

  switch (contentType) {
    case 'notes': {
      let query = supabase
        .from('notes')
        .select('id, title, category_id, published, category:categories(id, name)')
        .order('id', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_id', Number(categoryFilter));
      }
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        category: n.category?.name || 'General',
        subtitle: n.category?.name || 'Mathematics',
        published: n.published,
      }));
    }

    case 'paid_ebooks': {
      let query = supabase
        .from('paid_ebooks')
        .select('id, title, category, price, published')
        .order('id', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        category: b.category,
        subtitle: `₹${b.price} • ${b.category?.toUpperCase()}`,
        published: b.published,
      }));
    }

    case 'free_ebooks': {
      let query = supabase
        .from('free_ebooks')
        .select('id, title, category, published')
        .order('id', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        category: b.category,
        subtitle: `Free • ${b.category?.toUpperCase()}`,
        published: b.published,
      }));
    }

    case 'current_affairs': {
      let query = supabase
        .from('current_affairs')
        .select('id, title, published, created_at')
        .order('id', { ascending: false });

      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((ca: any) => ({
        id: ca.id,
        title: ca.title,
        category: 'Current Affairs',
        subtitle: ca.created_at ? new Date(ca.created_at).toLocaleDateString() : 'Current Affairs',
        published: ca.published,
      }));
    }

    case 'exam_patterns': {
      let query = supabase
        .from('exam_patterns')
        .select('id, exam_category, exam_name, published')
        .order('id', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('exam_category', categoryFilter);
      }
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('exam_name', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((ep: any) => ({
        id: ep.id,
        title: ep.exam_name,
        category: ep.exam_category,
        subtitle: `${ep.exam_category} Exam`,
        published: ep.published,
      }));
    }

    case 'study_resources': {
      let query = supabase
        .from('study_resources')
        .select('id, title, category, published')
        .order('id', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((sr: any) => ({
        id: sr.id,
        title: sr.title,
        category: sr.category,
        subtitle: sr.category,
        published: sr.published,
      }));
    }

    default:
      return [];
  }
}

// Fetch categories for Notes (from categories table)
export async function fetchNoteCategories(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return (data || []).filter(
    (c) => c.name.toLowerCase() !== 'current affairs' && c.id !== 9
  );
}

// Admin Database Mutations
export async function addRecommendation(rec: {
  content_type: RecommendationContentType;
  content_id: number;
  display_order?: number;
  is_active?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('top_recommendations').insert({
    content_type: rec.content_type,
    content_id: rec.content_id,
    display_order: rec.display_order ?? 0,
    is_active: rec.is_active ?? true,
  });

  if (error) throw error;
}

export async function updateRecommendation(
  id: number,
  updates: {
    content_type?: RecommendationContentType;
    content_id?: number;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('top_recommendations')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function toggleRecommendationStatus(id: number, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('top_recommendations')
    .update({ is_active })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteRecommendation(id: number): Promise<void> {
  // CRITICAL: Deletes ONLY the recommendation entry. Original content is NEVER deleted.
  const { error } = await supabase
    .from('top_recommendations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
