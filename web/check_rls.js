const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hydegfcxuoychqkxzytd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGVnZmN4dW95Y2hxa3h6eXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM0NDQ0MiwiZXhwIjoyMDk1OTIwNDQyfQ.Ag-7casDqi4XJD7tO7IxtRq2CDracBs_OhnfwGM6vfs'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_test'); // Probably won't work
  
  // Let's just create a SQL query via REST by creating a dummy function if we had raw access. We don't.
  // I will just fetch 1 private_messages
  const { data: msgs, error: msgsErr } = await supabase.from('private_messages').select('*').limit(1);
  console.log("Messages via service key:", msgs ? "success (count " + msgs.length + ")" : msgsErr);

}
check();
