const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const path = 'notes/1789386456486-04pshd-TIME__SPEED___DISTANCE_PRACTICE_SHEET.pdf';
  
  const { data } = supabase.storage.from('pdf-notes').getPublicUrl(path);
  console.log("Public URL:", data?.publicUrl);
  
  const res = await fetch(data.publicUrl);
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
run();
