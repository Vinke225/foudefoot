import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { type: string } }) {
  const { type } = params;
  // type can be: topscorers, topassists, topyellowcards, topredcards

  const validTypes = ['topscorers', 'topassists', 'topyellowcards', 'topredcards'];
  
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Use the World Cup 2022 by default
  const league = 1;
  const season = 2022;

  try {
    const apiUrl = `https://v3.football.api-sports.io/players/${type}?league=${league}&season=${season}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY || 'bd7b1d0554f3b75d1ca387069f99abc0',
      },
      // Revalidate every 24 hours since historical stats don't change often
      next: { revalidate: 86400 } 
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-SPORTS Error:', data.errors);
      return NextResponse.json({ error: 'API Error' }, { status: 500 });
    }

    // Format the data to make it easier for the frontend
    const players = data.response?.map((item: any) => {
      const p = item.player;
      const s = item.statistics[0];
      return {
        id: p.id,
        name: p.name,
        photo: p.photo,
        team: s.team.name,
        teamLogo: s.team.logo,
        goals: s.goals.total || 0,
        assists: s.goals.assists || 0,
        yellowCards: s.cards.yellow || 0,
        redCards: s.cards.red || 0,
        rating: s.games.rating ? parseFloat(s.games.rating).toFixed(1) : '-',
        position: s.games.position
      };
    }) || [];

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
