const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.log("No env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('free_ebooks').select('*').limit(1);
  console.log("Select:", error ? error : "OK");
  
  // Try to delete a non-existent ID to see if we get an RLS error or just no rows
  const { error: delError } = await supabase.from('free_ebooks').delete().eq('id', 999999);
  console.log("Delete error:", delError);
}
test();
