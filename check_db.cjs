const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('paid_ebooks').select('*').limit(1);
  console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'no data');
  if (data && data.length === 0) {
     const { data: d2 } = await supabase.rpc('get_table_info', { table_name: 'paid_ebooks' });
     console.log('RPC:', d2);
  }
}
check();
