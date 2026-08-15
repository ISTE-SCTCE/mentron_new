const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysllolnoyezfdllqocgv.supabase.co';
const supabaseKey = 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotes() {
    console.log("Fetching all notes...");
    const { data, error } = await supabase.from('notes').select('*');
    if (error) {
        console.error("Error fetching notes:", error);
    } else {
        console.log(`Found ${data.length} notes:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkNotes();
