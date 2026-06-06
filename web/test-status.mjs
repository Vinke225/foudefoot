import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const response = await fetch(`${SUPABASE_URL}/rest/v1/matches?select=status`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
});
const data = await response.json();
const statuses = new Set(data.map(m => m.status));
console.log('Statuses in DB:', Array.from(statuses));
