const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'admin_' + Date.now() + '@example.com';
  const password = 'password123';
  const { data: authData } = await supabase.auth.signUp({ email, password });
  
  // Make them admin
  const { error: insertError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    role: 'admin',
    full_name: 'Admin Test'
  });
  console.log("Admin Insert Error:", insertError?.message);

  const { data: dbData } = await supabase.from('notes').select('file_path').limit(1);
  const path = dbData[0].file_path;
  
  const { data, error } = await supabase.storage.from('pdf-notes').createSignedUrl(path, 60);
  console.log("Admin Signed URL Error:", error?.message);
  console.log("Admin Signed URL Data:", !!data);
}
run();
