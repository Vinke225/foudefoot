import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const garbageTeams = ['Marcilio Dias', 'Maguary', 'Colombia', 'Azuriz', 'Sousa', 'Costa Rica'];
  
  for (const team of garbageTeams) {
    console.log(`Deleting matches involving ${team}...`);
    // Delete where home_team == team
    await fetch(`${supabaseUrl}/rest/v1/matches?home_team=eq.${encodeURIComponent(team)}`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    // Delete where away_team == team
    await fetch(`${supabaseUrl}/rest/v1/matches?away_team=eq.${encodeURIComponent(team)}`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
  }
  
  console.log('Garbage matches deleted!');
}

main();
