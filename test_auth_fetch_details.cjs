const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'password123';
  const { data: authData } = await supabase.auth.signUp({ email, password });
  console.log("My UID:", authData.user.id);
  
  const { data: dbData } = await supabase.from('notes').select('file_path').limit(1);
  const path = dbData[0].file_path;
  
  // List files to get owner
  const { data: listData, error: listError } = await supabase.storage.from('pdf-notes').list('notes');
  if (listData) {
     const file = listData.find(f => 'notes/' + f.name === path);
     console.log("File Owner:", file?.metadata?.owner);
  }
}
run();
