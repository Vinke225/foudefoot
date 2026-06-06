// cspell:disable
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Admin pour pouvoir écrire dans la DB depuis le backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const apiKey = process.env.APIFOOTBALL_KEY || '14489a24c7a2602d88fcbbae12deab98ab32ef98dcd11ae567f29640de3d7eed';
    
    // Récupérer la date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    const url = `https://apiv3.apifootball.com/?action=get_events&from=${today}&to=${today}&APIkey=${apiKey}`;

    console.log(`Début de la synchronisation des matchs (APIFootball) pour le ${today}...`);

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }

    const data = await response.json();
    
    // APIFootball renvoie un tableau d'événements, ou un objet d'erreur s'il n'y a pas de matchs
    let fixtures = data;
    if (!Array.isArray(fixtures)) {
      if (data.error) {
        console.log("Aucun match trouvé ou erreur API:", data.message || data.error);
        return NextResponse.json({ success: true, message: "Aucun match aujourd'hui ou erreur API", data });
      }
      fixtures = [];
    }

    interface ApiFootballMatch {
      match_id: string;
      match_hometeam_name: string;
      match_awayteam_name: string;
      match_hometeam_score: string;
      match_awayteam_score: string;
      match_status: string;
      match_live: string;
      team_home_badge: string;
      team_away_badge: string;
      lineup?: Record<string, unknown>;
      statistics?: Array<Record<string, unknown>>;
    }

    const importantLeagues = ["1", "3", "4", "17", "24", "28", "29", "61", "152", "166", "175", "207", "302", "345"];
    
    const matchesToInsert = fixtures
      .filter((match: ApiFootballMatch) => match.match_id && match.match_hometeam_name && match.match_awayteam_name)
      .filter((match: any) => importantLeagues.includes(match.league_id?.toString()) || match.country_name === "World")
      .map((match: any) => {
        let score = null;
        if (match.match_hometeam_score !== "" && match.match_awayteam_score !== "") {
          score = `${match.match_hometeam_score} - ${match.match_awayteam_score}`;
        }
        
        let status = 'NS';
        if (match.match_status === 'Finished' || match.match_status === 'FT' || match.match_status === 'AET' || match.match_status === 'PEN') {
          status = 'FT';
        } else if (match.match_live === '1') {
          status = 'LIVE';
        }

        return {
          api_id: match.match_id,
          home_team: match.match_hometeam_name,
          away_team: match.match_awayteam_name,
          home_logo: match.team_home_badge || null,
          away_logo: match.team_away_badge || null,
          score: score,
          status: status,
          lineups: match.lineup || null,
          statistics: match.statistics || null
        };
      });

    let updatedCount = 0;
    
    if (matchesToInsert.length > 0) {
      const { error } = await supabase
        .from('matches')
        .upsert(matchesToInsert, { onConflict: 'api_id' })
        .select();

      if (error) {
        console.error("Erreur d'insertion en masse:", error);
      } else {
        updatedCount = matchesToInsert.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount} matchs synchronisés avec succès depuis APIFootball.`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la synchro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
