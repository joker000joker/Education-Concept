const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  // Without credentials, I am anonymous.
}
