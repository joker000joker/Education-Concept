const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'password123';
  await supabase.auth.signUp({ email, password });
  
  const { data: listData, error: listError } = await supabase.storage.from('pdf-notes').list('notes');
  if (listData && listData.length > 0) {
     console.log("File:", listData[0]);
  }
}
run();
