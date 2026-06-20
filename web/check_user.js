const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hydegfcxuoychqkxzytd.supabase.co',
  process.env.SUPABASE_KEY
);

async function check() {
  const { data, error } = await supabase.from('users').select('*').eq('id', '9c6d3f4b-d14f-4f8c-93ec-d1df108ae11b');
  console.log("Data:", data, "Error:", error);
}

check();
