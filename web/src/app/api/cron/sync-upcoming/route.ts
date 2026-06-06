// cspell:disable
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getFormattedDate(daysOffset: number = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Format YYYY-MM-DD attendu par APIFootball
}

export async function GET() {
  try {
    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY in .env.local");
    }
    
    // On synchronise les matchs d'aujourd'hui et de demain
    const dateFrom = getFormattedDate(0);
    const dateTo = getFormattedDate(1);
    let totalUpdated = 0;

    console.log(`Début de la synchronisation APIFootball du ${dateFrom} au ${dateTo}...`);

    const url = `https://apiv3.apifootball.com/?action=get_events&from=${dateFrom}&to=${dateTo}&APIkey=${apiKey}`;

    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Erreur APIFootball: ${response.statusText}`);
    }

    const data = await response.json();
    
    // APIFootball renvoie un tableau directement, ou un objet avec error
    if (data.error) {
       throw new Error(`API returned error: ${data.message || JSON.stringify(data.error)}`);
    }

    const fixtures = Array.isArray(data) ? data : [];

    const importantLeagues = ["28", "152", "302", "207", "175", "168"];
    
    for (const match of fixtures) {
      if (!match.match_id) continue;
      // Ne garder que les 6 grandes compétitions
      if (!importantLeagues.includes(match.league_id?.toString() || '')) continue;

      const apiId = match.match_id;
      const homeTeam = match.match_hometeam_name;
      const awayTeam = match.match_awayteam_name;
      
      const homeLogo = match.team_home_badge || null;
      const awayLogo = match.team_away_badge || null;

      let score = null;
      if (match.match_hometeam_ft_score !== "" && match.match_awayteam_ft_score !== "") {
         score = `${match.match_hometeam_ft_score} - ${match.match_awayteam_ft_score}`;
      } else if (match.match_hometeam_score !== "" && match.match_awayteam_score !== "") {
         score = `${match.match_hometeam_score} - ${match.match_awayteam_score}`;
      }

      let status = 'NS'; 
      if (match.match_live === "1" || match.match_status === "Half Time") {
         status = 'LIVE';
      } else if (match.match_status === "Finished" || match.match_status === "After Pen.") {
         status = 'FT'; 
      }

      const { error } = await supabase
        .from('matches')
        .upsert({ 
          api_id: apiId,
          home_team: homeTeam, 
          away_team: awayTeam,
          home_logo: homeLogo,
          away_logo: awayLogo,
          score: score, 
          status: status 
        }, { onConflict: 'api_id' });

      if (!error) totalUpdated++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${totalUpdated} matchs du calendrier synchronisés avec succès via APIFootball.`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la synchro du calendrier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
