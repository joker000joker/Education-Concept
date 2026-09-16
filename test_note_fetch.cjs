const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'password123';
  await supabase.auth.signUp({ email, password });
  
  const { data, error } = await supabase.from('notes').select('*').limit(5);
  console.log("Notes Error:", error?.message);
  console.log("Notes fetched:", data?.length);
}
run();
