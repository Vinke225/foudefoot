import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/matches?select=id,home_team,away_team,status`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  
  // Find matches where status is not finished or postponed
  const activeMatches = data.filter((m: any) => m.status !== 'Finished' && m.status !== 'Postponed' && m.status !== 'Cancelled');
  
  console.log('Active matches teams:', activeMatches.map((m: any) => `${m.home_team} vs ${m.away_team} (${m.status})`));
}

main();
