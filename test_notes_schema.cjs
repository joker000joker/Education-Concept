const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('notes').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data, try insert to get error?");
    const { error: err2 } = await supabase.from('notes').insert({ invalid_column: 1 });
    console.log(err2.message);
  }
}
run();
