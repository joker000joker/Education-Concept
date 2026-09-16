const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
  console.log("exec_sql:", error ? error.message : "Success");
}
run();
