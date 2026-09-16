const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: 'Bearer invalid_token_123'
      }
    }
  });
  
  const { data: dbData } = await supabase.from('notes').select('file_path').limit(1);
  const path = 'notes/1789386456486-04pshd-TIME__SPEED___DISTANCE_PRACTICE_SHEET.pdf';
  
  const { data, error } = await supabase.storage.from('pdf-notes').createSignedUrl(path, 60);
  console.log("Signed URL Error:", error?.message);
}
run();
