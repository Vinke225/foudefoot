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

    // 1. Check if we already have the stats in Supabase to save API calls
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('statistics, status')
      .eq('api_id', apiId)
      .single();

    if (existingMatch && existingMatch.statistics && existingMatch.statistics.length > 0) {
      // If the match is Finished (FT), we can just return the cached stats
      if (existingMatch.status === 'FT') {
        return NextResponse.json({ statistics: existingMatch.statistics });
      }
    }

    // 2. Fetch from API-SPORTS
    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY");
    }

    const url = `https://v3.football.api-sports.io/fixtures/statistics?fixture=${apiId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
       return NextResponse.json({ error: Object.values(data.errors)[0] }, { status: 400 });
    }

    if (!data.response || data.response.length === 0) {
       return NextResponse.json({ statistics: [] });
    }

    // 3. Transform API-SPORTS format to our App Format
    // API-SPORTS returns an array of 2 objects (home and away)
    const homeTeamStats = data.response[0]?.statistics || [];
    const awayTeamStats = data.response[1]?.statistics || [];

    const formattedStats = homeTeamStats.map((homeStat: any, index: number) => {
      const awayStat = awayTeamStats[index];
      return {
        type: homeStat.type,
        home: homeStat.value !== null ? String(homeStat.value) : "0",
        away: awayStat && awayStat.value !== null ? String(awayStat.value) : "0"
      };
    });

    // 4. Save to Supabase for caching
    if (formattedStats.length > 0) {
      await supabase
        .from('matches')
        .update({ statistics: formattedStats })
        .eq('api_id', apiId);
    }

    return NextResponse.json({ statistics: formattedStats });

  } catch (error: unknown) {
    console.error('Erreur Proxy Stats API-SPORTS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
