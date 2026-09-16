const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('categories').insert({ id: 101, name: 'Paid E-Books - SSC' }).select();
  console.log("Insert category error:", error ? error.message : "Success");
}
run();
