const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const newFunctions = `
export async function fetchFreeEbookById(id: number | string): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('free_ebooks')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.warn('[Supabase] Warning fetching free ebook by id:', error.message || error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] Exception in fetchFreeEbookById:', err);
    return null;
  }
}

export async function fetchCurrentAffairById(id: number | string): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('current_affairs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.warn('[Supabase] Warning fetching current affair by id:', error.message || error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] Exception in fetchCurrentAffairById:', err);
    return null;
  }
}
`;

code = code.replace(
  `export async function fetchNoteById`,
  newFunctions + `\nexport async function fetchNoteById`
);
fs.writeFileSync('src/lib/supabase.ts', code);
console.log('Patched');
