const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Inspect notes
  let { data: notesData, error: notesError } = await supabase.from('notes').select('*').limit(1);
  console.log("Notes columns:", notesData && notesData.length > 0 ? Object.keys(notesData[0]) : "No data or error", notesError ? notesError.message : "");
  
  // Inspect categories
  let { data: catData, error: catError } = await supabase.from('categories').select('*').limit(5);
  console.log("Categories:", catData, catError ? catError.message : "");
}
run();
