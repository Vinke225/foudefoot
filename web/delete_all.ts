import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://hydegfcxuoychqkxzytd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZGVnZmN4dW95Y2hxa3h6eXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM0NDQ0MiwiZXhwIjoyMDk1OTIwNDQyfQ.Ag-7casDqi4XJD7tO7IxtRq2CDracBs_OhnfwGM6vfs';

async function main() {
  console.log('Deleting ALL matches from Supabase PRODUCTION...');
  const res = await fetch(`${supabaseUrl}/rest/v1/matches?id=not.is.null`, {
    method: 'DELETE',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  console.log('Status:', res.status, await res.text());
}

main();
