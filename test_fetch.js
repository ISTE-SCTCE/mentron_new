const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co';
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching profiles...");
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} profiles:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

testFetch();
