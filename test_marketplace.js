import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co';
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*, profiles(full_name, department, admission_year)')
    .eq('status', 'pending_review');

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  if (data?.length > 0) {
    console.log('Sample item:', data[0]);
  }
}

testQuery();
