const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tables = ['paid_ebooks', 'free_ebooks', 'current_affairs', 'banners', 'tests'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    console.log(`${t}:`, error ? error.message : "Exists");
  }
}
run();
