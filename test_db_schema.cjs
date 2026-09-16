const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Actually we might need service_role for full schema, but let's see what we can fetch

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  // Just query some possible tables
  const tables = ['profiles', 'categories', 'notes', 'paid_ebooks', 'free_ebooks', 'current_affairs', 'exam_patterns', 'study_resources', 'tests', 'questions', 'banners'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} exists.`);
    }
  }
}
run();
