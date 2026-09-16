const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'password123';
  await supabase.auth.signUp({ email, password });
  
  // Try to download the first file
  const { data: dbData } = await supabase.from('notes').select('file_path').limit(1);
  const path = dbData[0].file_path;
  console.log("Path:", path);
  
  const { data, error } = await supabase.storage.from('pdf-notes').download(path);
  console.log("Download Error:", error?.message);
  console.log("Download Data:", !!data);
}
run();
