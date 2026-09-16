import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Note, Profile } from '../types';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_KEY : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const STORAGE_BUCKET = 'pdf-notes';

// Format bytes to human readable size
export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// User profile & admin role service
// Uses supabase.rpc('is_admin') as the source of truth for admin detection.
export async function checkIsAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.warn('[Supabase] supabase.rpc("is_admin") error:', error.message);
      return false;
    }
    return data === true || String(data).toLowerCase() === 'true';
  } catch (err) {
    console.error('[Supabase] Exception calling supabase.rpc("is_admin"):', err);
    return false;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await fetchUserProfileAndRole(userId);
  return result.profile;
}

export async function fetchUserProfileAndRole(userId: string): Promise<{
  profile: Profile | null;
  role: 'admin' | 'user';
  isAdmin: boolean;
}> {
  if (!isSupabaseConfigured || !userId) {
    return { profile: null, role: 'user', isAdmin: false };
  }

  // 1. Source of truth for admin detection: supabase.rpc('is_admin')
  const isRpcAdmin = await checkIsAdmin();
  const isAdmin = isRpcAdmin;
  const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

  // 2. Fetch user profile from public.profiles without letting any failure override admin status
  let profileData: Profile | null = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Note: profiles query failed, admin status preserved via is_admin():', error.message);
    } else if (data) {
      profileData = data as Profile;
    }
  } catch (err) {
    console.warn('[Supabase] Note: profiles query exception, admin status preserved via is_admin():', err);
  }

  // Build profile object ensuring role reflects the source of truth
  const finalProfile: Profile = profileData
    ? {
        ...profileData,
        role: isAdmin ? 'admin' : (profileData.role === 'admin' ? 'admin' : 'user'),
      }
    : {
        id: userId,
        mobile: null,
        role,
      };

  return {
    profile: finalProfile,
    role,
    isAdmin,
  };
}

// Category service
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Error fetching categories:', error.message);
      return [];
    }
    return (data || []) as Category[];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

// Notes queries
export interface FetchNotesOptions {
  categoryId?: number | null;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'title';
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchNotes(options: FetchNotesOptions = {}): Promise<{ notes: Note[]; count: number }> {
  if (!isSupabaseConfigured) return { notes: [], count: 0 };

  try {
    let query = supabase
      .from('notes')
      .select('*, category:categories(id, name)', { count: 'exact' });

    if (options.publishedOnly !== false) {
      query = query.eq('published', true);
    }

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options.search && options.search.trim()) {
      const term = options.search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    switch (options.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notes:', error.message);
      throw error;
    }

    return {
      notes: (data || []) as Note[],
      count: count || 0,
    };
  } catch (err) {
    console.error('fetchNotes error:', err);
    throw err;
  }
}

export async function fetchNoteById(id: number | string): Promise<Note | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching note by id:', error.message);
      return null;
    }

    return data as Note;
  } catch (err) {
    console.error('fetchNoteById error:', err);
    return null;
  }
}

// Storage helpers
function sanitizeFilePath(filePath: string): string {
  if (!filePath) return filePath;
  let cleanPath = filePath;
  
  if (cleanPath.includes('/storage/v1/object/public/')) {
    cleanPath = cleanPath.split('/storage/v1/object/public/')[1];
  } else if (cleanPath.includes('/storage/v1/object/sign/')) {
    cleanPath = cleanPath.split('/storage/v1/object/sign/')[1];
  }
  
  // Remove any query parameters (like ?token=...)
  if (cleanPath.includes('?')) {
    cleanPath = cleanPath.split('?')[0];
  }
  
  // Decode URI components (e.g. %20 -> space)
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (e) {
    // Ignore malformed URIs
  }
  
  cleanPath = cleanPath.replace(/^\/+/, "");
  if (cleanPath.startsWith(STORAGE_BUCKET + '/')) {
    cleanPath = cleanPath.substring(STORAGE_BUCKET.length + 1);
  }
  return cleanPath;
}

export async function getSecurePdfUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
  if (!isSupabaseConfigured || !filePath) return null;
  try {
    const cleanPath = sanitizeFilePath(filePath);
    
    // Ensure the auth session is fully loaded from local storage before making the request
    // This prevents race conditions on page load where the request might fire as 'anon'
    // before the user's session is fully restored.
    await supabase.auth.getSession();
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      if (error.message.includes('Object not found')) {
        console.warn(`File not found in storage: ${cleanPath}`);
      } else {
        console.error('Error creating signed URL:', error.message);
      }
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error('getSecurePdfUrl error:', err);
    return null;
  }
}

export async function downloadNotePdf(filePath: string, fileName: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const cleanPath = sanitizeFilePath(filePath);
  
  // Ensure session is loaded
  await supabase.auth.getSession();
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(cleanPath);

  if (error) {
    if (error.message.includes('Object not found')) {
      throw new Error('FILE_NOT_FOUND');
    }
    throw new Error(error.message || 'Failed to download file.');
  }

  // Create temporary link and trigger download
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Admin note operations
export async function uploadPdfFile(
  file: File,
  prefix = 'notes'
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured.');
  }

  // Sanitize filename and create unique storage path
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `${prefix}/${uniqueId}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }

  return {
    filePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

export async function deletePdfFile(filePath: string): Promise<void> {
  if (!isSupabaseConfigured || !filePath) return;
  try {
    const cleanPath = sanitizeFilePath(filePath);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([cleanPath]);

    if (error) {
      console.warn('Failed to remove file from storage:', error.message);
    }
  } catch (err) {
    console.warn('deletePdfFile error:', err);
  }
}

export async function createNoteRecord(noteData: {
  title: string;
  description: string | null;
  category_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  published: boolean;
  uploaded_by: string;
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert([noteData])
    .select('*, category:categories(id, name)')
    .single();

  if (error) {
    throw new Error(`Failed to save note record: ${error.message}`);
  }

  return data as Note;
}

export async function updateNoteRecord(
  id: number,
  updates: Partial<{
    title: string;
    description: string | null;
    category_id: number;
    file_path: string;
    file_name: string;
    file_size: number;
    published: boolean;
  }>
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, category:categories(id, name)')
    .single();

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return data as Note;
}

export async function deleteNoteRecord(id: number, filePath?: string): Promise<void> {
  // First delete the storage file if path provided
  if (filePath) {
    await deletePdfFile(filePath);
  }

  // Delete the database row
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete note record: ${error.message}`);
  }
}

export async function toggleNotePublishStatus(id: number, currentStatus: boolean): Promise<boolean> {
  const nextStatus = !currentStatus;
  const { error } = await supabase
    .from('notes')
    .update({ published: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to toggle publish status: ${error.message}`);
  }

  return nextStatus;
}

// Update profile record in public.profiles (e.g. mobile)
export async function updateProfileRecord(
  userId: string,
  updates: Partial<{ mobile: string | null; full_name: string | null }>
): Promise<Profile> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  if (!data) {
    // If no row was returned, it might mean the row didn't exist or RLS blocked SELECT.
    // Try to insert it if it doesn't exist, carefully avoiding overwriting role if it does.
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'user', // Default role for new profiles
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();

    if (insertError) {
      // If insert fails (e.g. duplicate key because row DOES exist but RLS blocked SELECT on update),
      // we can just return a merged object to let the UI continue
      console.warn('[Supabase] Non-fatal: profile update/insert mismatch (likely RLS SELECT blocked).', insertError);
      return { id: userId, role: 'user', ...updates } as Profile;
    }
    
    return (insertData || { id: userId, role: 'user', ...updates }) as Profile;
  }

  return data as Profile;
}

// Securely update the user's password using Supabase Auth
export async function updateAccountPassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update account password.');
  }
}


// Image upload helper
export async function uploadImageFile(
  file: File,
  prefix = 'covers'
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured.');
  }

  // Sanitize filename and create unique storage path
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `${prefix}/${uniqueId}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }

  return {
    filePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

// Paid E-Books Interface
export interface PaidEbook {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  file_path: string;
  file_name: string;
  file_size: number;
  cover_image_path: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
