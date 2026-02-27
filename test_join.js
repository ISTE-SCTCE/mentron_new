const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co';
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('notes')
        .select('*, profiles!notes_created_by_fkey(full_name)');

    if (error) {
        console.error("Test Query Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success! Data preview:", JSON.stringify(data.slice(0, 1), null, 2));
    }
}

testQuery();
