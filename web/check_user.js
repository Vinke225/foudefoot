const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hydegfcxuoychqkxzytd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGVnZmN4dW95Y2hxa3h6eXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDQ0NDIsImV4cCI6MjA5NTkyMDQ0Mn0.gLgpVbgfTFu_77gnwAW13c0yCRbVAMO5a6jFHSz-w_I'
);

async function check() {
  const { data, error } = await supabase.from('users').select('*').eq('id', '9c6d3f4b-d14f-4f8c-93ec-d1df108ae11b');
  console.log("Data:", data, "Error:", error);
}

check();
