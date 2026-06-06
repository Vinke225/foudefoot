// cspell:disable
import { NextResponse } from 'next/server';

export interface LiveMatchEvent {
  time: string;
  type: 'BUT' | 'CARTON_JAUNE' | 'CARTON_ROUGE' | 'PENALTY' | 'PROLONGATION';
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
  statistics: Array<{ type: string; home: string; away: string }>;
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

    const url = `https://apiv3.apifootball.com/?action=get_events&match_id=${apiId}&APIkey=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      // Pas de cache pour les données live
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`APIFootball error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.message }, { status: 404 });
    }

    const match = Array.isArray(data) ? data[0] : null;
    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // --- Détermination du statut ---
    const isLive = match.match_live === '1';
    const isFinished =
      match.match_status === 'Finished' ||
      match.match_status === 'FT' ||
      match.match_status === 'AET' ||
      match.match_status === 'PEN';

    // --- Construction des événements unifiés ---
    const events: LiveMatchEvent[] = [];

    // Buts
    if (Array.isArray(match.goalscorer)) {
      for (const g of match.goalscorer) {
        const isHome = g.home_scorer && g.home_scorer !== '';
        const player = isHome ? g.home_scorer : g.away_scorer;
        if (!player) continue;

        events.push({
          time: g.time || '?',
          type: g.info?.toLowerCase().includes('penalty') ? 'PENALTY' : 'BUT',
          team: isHome ? 'home' : 'away',
          player,
          score: g.score,
          info: g.info || '',
        });
      }
    }

    // Cartons
    if (Array.isArray(match.cards)) {
      for (const c of match.cards) {
        const isHome = c.home_fault && c.home_fault !== '';
        const player = isHome ? c.home_fault : c.away_fault;
        if (!player) continue;

        const cardType = c.card?.toLowerCase().includes('red')
          ? 'CARTON_ROUGE'
          : 'CARTON_JAUNE';

        events.push({
          time: c.time || '?',
          type: cardType,
          team: isHome ? 'home' : 'away',
          player,
        });
      }
    }

    // Trier par minute
    events.sort((a, b) => {
      const tA = parseInt(a.time.replace('+', '.')) || 0;
      const tB = parseInt(b.time.replace('+', '.')) || 0;
      return tA - tB;
    });

    // --- Possession ---
    const stats = Array.isArray(match.statistics) ? match.statistics : [];
    const possessionStat = stats.find(
      (s: { type: string; home: string }) =>
        s.type === 'Ball Possession' || s.type === 'Possession'
    );
    const homePossession = possessionStat
      ? parseInt(possessionStat.home)
      : 50;

    // --- Score ---
    const homeScore = match.match_hometeam_score || '0';
    const awayScore = match.match_awayteam_score || '0';
    const score =
      homeScore !== '' && awayScore !== ''
        ? `${homeScore} - ${awayScore}`
        : null;

    const htHome = match.match_hometeam_halftime_score;
    const htAway = match.match_awayteam_halftime_score;
    const halfTimeScore =
      htHome !== '' && htAway !== '' ? `${htHome} - ${htAway}` : null;

    const liveData: LiveMatchData = {
      isLive,
      isFinished,
      status: match.match_status || 'NS',
      matchTime: match.match_time || '',
      matchDate: match.match_date || '',
      matchElapsed: match.match_status || '',
      homeScore,
      awayScore,
      score: score || '0 - 0',
      halfTimeScore: halfTimeScore || '0 - 0',
      events,
      statistics: stats,
      homePossession,
    };

    return NextResponse.json(liveData);
  } catch (error: unknown) {
    console.error('Erreur route live:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
