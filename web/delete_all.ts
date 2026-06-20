import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://hydegfcxuoychqkxzytd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
