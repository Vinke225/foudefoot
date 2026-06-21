// cspell:disable
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface LiveMatchEvent {
  time: string;
  type: 'BUT' | 'CARTON_JAUNE' | 'CARTON_ROUGE' | 'PENALTY' | 'PROLONGATION' | 'REMPLACEMENT';
  team: 'home' | 'away';
  player: string;
  score?: string;
  info?: string;
}

export interface LiveMatchData {
  isLive: boolean;
  isFinished: boolean;
  status: string;
  matchTime: string;
  matchDate: string;
  matchElapsed: string;
  homeScore: string;
  awayScore: string;
  score: string;
  halfTimeScore: string;
  events: LiveMatchEvent[];
  homePossession: number;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ api_id: string }> }
) {
  try {
    const params = await props.params;
    const apiId = params.api_id;

    if (!apiId) {
      return NextResponse.json({ error: 'Missing api_id' }, { status: 400 });
    }

    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const url = `https://v3.football.api-sports.io/fixtures?id=${apiId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
      // Pas de cache pour les données live
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`API-SPORTS error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return NextResponse.json({ error: Object.values(data.errors)[0] }, { status: 404 });
    }

    const matchData = data.response && data.response.length > 0 ? data.response[0] : null;
    if (!matchData) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    const fixture = matchData.fixture;
    const teams = matchData.teams;
    const goals = matchData.goals;
    const scoreObj = matchData.score;
    const eventsRaw = matchData.events || [];
    const statsRaw = matchData.statistics || [];

    // --- Détermination du statut ---
    const shortStatus = fixture.status.short;
    const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(shortStatus);
    const isFinished = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(shortStatus);

    // --- Construction des événements unifiés ---
    const events: LiveMatchEvent[] = [];

    for (const ev of eventsRaw) {
      const isHome = ev.team.id === teams.home.id;
      let type: LiveMatchEvent['type'] = 'BUT';
      
      if (ev.type === 'Goal') {
        type = ev.detail === 'Penalty' ? 'PENALTY' : 'BUT';
      } else if (ev.type === 'Card') {
        type = ev.detail.includes('Red') ? 'CARTON_ROUGE' : 'CARTON_JAUNE';
      } else if (ev.type === 'subst') {
        type = 'REMPLACEMENT';
      } else {
        continue;
      }

      events.push({
        time: ev.time.elapsed.toString() + (ev.time.extra ? `+${ev.time.extra}` : ''),
        type,
        team: isHome ? 'home' : 'away',
        player: ev.player.name,
        score: type === 'BUT' || type === 'PENALTY' ? `${goals.home}-${goals.away}` : undefined,
        info: ev.assist?.name ? `Passe: ${ev.assist.name}` : ev.detail,
      });
    }

    // --- Possession ---
    let homePossession = 50;
    if (statsRaw.length > 0) {
      const homeStats = statsRaw[0]?.statistics || [];
      const possessionStat = homeStats.find((s: any) => s.type === 'Ball Possession');
      if (possessionStat && possessionStat.value) {
        homePossession = parseInt(possessionStat.value.replace(/%/g, ''));
      }
    }

    // --- Score ---
    const homeScore = goals.home !== null ? goals.home.toString() : '0';
    const awayScore = goals.away !== null ? goals.away.toString() : '0';
    const scoreStr = goals.home !== null && goals.away !== null ? `${homeScore} - ${awayScore}` : '0 - 0';

    const htHome = scoreObj.halftime.home !== null ? scoreObj.halftime.home : '';
    const htAway = scoreObj.halftime.away !== null ? scoreObj.halftime.away : '';
    const halfTimeScoreStr = htHome !== '' && htAway !== '' ? `${htHome} - ${htAway}` : '0 - 0';

    // Update the live score and status in Supabase so users don't have to wait for cron
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('matches').update({
        score: scoreStr,
        status: isFinished ? 'FT' : (isLive ? 'LIVE' : 'NS'),
      }).eq('api_id', apiId);
    } catch (e) {
      console.error("Failed to update live match in Supabase", e);
    }

    const liveData: LiveMatchData = {
      isLive,
      isFinished,
      status: shortStatus || 'NS',
      matchTime: fixture.date || '',
      matchDate: fixture.date || '',
      matchElapsed: fixture.status.elapsed ? `${fixture.status.elapsed}'` : shortStatus,
      homeScore,
      awayScore,
      score: scoreStr,
      halfTimeScore: halfTimeScoreStr,
      events,
      homePossession,
    };

    return NextResponse.json(liveData);
  } catch (error: unknown) {
    console.error('Erreur route live:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
