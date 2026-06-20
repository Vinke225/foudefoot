// cspell:disable
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Admin pour pouvoir écrire dans la DB depuis le backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY in environment");
    }
    
    const todayObj = new Date();
    
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toISOString().split('T')[0];

    const today = todayObj.toISOString().split('T')[0];

    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrow = tomorrowObj.toISOString().split('T')[0];
    
    const datesToSync = [yesterday, today, tomorrow];
    console.log(`Début de la synchronisation des matchs (API-SPORTS) pour ${yesterday}, ${today}, ${tomorrow}...`);

    const importantLeagues = [
      1, // World Cup
    ];

    let allFixtures: any[] = [];

    // Fetch fixtures for World Cup 2022 (Free API limitation)
    const url = `https://v3.football.api-sports.io/fixtures?league=1&season=2022`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      }
    });

    if (!response.ok) {
      console.error(`Erreur API:`, response.statusText);
    } else {
      const data = await response.json();
      if (data.response && Array.isArray(data.response)) {
        allFixtures = data.response;
      }
    }

    const matchesToInsert = allFixtures
      .filter((fixture: any) => fixture.fixture && fixture.teams && fixture.league)
      .filter((fixture: any) => importantLeagues.includes(fixture.league.id))
      .filter((fixture: any) => {
        const home = fixture.teams.home.name;
        const away = fixture.teams.away.name;
        const isYouth = /\bU\d{2}\b/i.test(home) || /\bU\d{2}\b/i.test(away);
        return !isYouth;
      })
      .map((item: any) => {
        const fixture = item.fixture;
        const league = item.league;
        const teams = item.teams;
        const goals = item.goals;

        let score = null;
        if (goals.home !== null && goals.away !== null) {
          score = `${goals.home} - ${goals.away}`;
        }

        // Mapping API-SPORTS status to our simplified status
        let status = 'NS';
        const shortStatus = fixture.status.short;
        if (['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(shortStatus)) {
          status = 'FT';
        } else if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(shortStatus)) {
          status = 'LIVE';
        }

        return {
          api_id: fixture.id.toString(),
          home_team: teams.home.name,
          away_team: teams.away.name,
          home_logo: teams.home.logo,
          away_logo: teams.away.logo,
          score: score,
          status: status,
          lineups: null,
          statistics: null,
          // Extra useful fields we can store for better UI later
          match_time: fixture.date,
          league_name: league.name
        };
      });

    // Remove duplicates (sometimes friendlies appear multiple times or timezone overlaps)
    const uniqueMatchesMap = new Map();
    for (const match of matchesToInsert) {
      uniqueMatchesMap.set(match.api_id, match);
    }
    const finalMatches = Array.from(uniqueMatchesMap.values());

    // Clean up old matches from other leagues that might have been synced previously
    await supabase.from('matches').delete().neq('league_name', 'World Cup');

    let updatedCount = 0;
    
    if (finalMatches.length > 0) {
      const { error } = await supabase
        .from('matches')
        .upsert(finalMatches, { onConflict: 'api_id' })
        .select();

      if (error) {
        console.error("Erreur d'insertion en masse:", error);
      } else {
        updatedCount = finalMatches.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount} matchs synchronisés avec succès depuis API-SPORTS.`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la synchro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
