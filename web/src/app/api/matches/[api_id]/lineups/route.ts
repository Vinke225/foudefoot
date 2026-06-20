// cspell:disable
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request, props: { params: Promise<{ api_id: string }> }) {
  try {
    const params = await props.params;
    const apiId = params.api_id;
    if (!apiId) {
      return NextResponse.json({ error: "Missing api_id" }, { status: 400 });
    }

    // 1. Check if we already have the lineups in Supabase to save API calls
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('lineups, status')
      .eq('api_id', apiId)
      .single();

    if (existingMatch && existingMatch.lineups && Object.keys(existingMatch.lineups).length > 0) {
      return NextResponse.json({ lineup: existingMatch.lineups });
    }

    // 2. Fetch from API-SPORTS
    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY");
    }

    const url = `https://v3.football.api-sports.io/fixtures/lineups?fixture=${apiId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      next: { revalidate: 600 } // Les compos changent peu, cache de 10 min
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
       return NextResponse.json({ error: Object.values(data.errors)[0] }, { status: 400 });
    }

    if (!data.response || data.response.length === 0) {
       return NextResponse.json({ lineup: null });
    }

    // 3. Transform API-SPORTS format to our App Format
    const mapPlayers = (playersArray: any[]) => {
      return playersArray.map((p: any) => ({
        lineup_player: p.player.name,
        lineup_number: p.player.number !== null ? String(p.player.number) : ""
      }));
    };

    const homeData = data.response[0] || {};
    const awayData = data.response[1] || {};

    const formattedLineups = {
      home: {
        starting_lineups: mapPlayers(homeData.startXI || []),
        substitutes: mapPlayers(homeData.substitutes || []),
        coach: homeData.coach && homeData.coach.name ? [{ lineup_player: homeData.coach.name }] : []
      },
      away: {
        starting_lineups: mapPlayers(awayData.startXI || []),
        substitutes: mapPlayers(awayData.substitutes || []),
        coach: awayData.coach && awayData.coach.name ? [{ lineup_player: awayData.coach.name }] : []
      }
    };

    // 4. Save to Supabase for caching
    if (formattedLineups.home.starting_lineups.length > 0) {
      await supabase
        .from('matches')
        .update({ lineups: formattedLineups })
        .eq('api_id', apiId);
    }

    return NextResponse.json({ lineup: formattedLineups });

  } catch (error: unknown) {
    console.error('Erreur Proxy Lineups API-SPORTS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
