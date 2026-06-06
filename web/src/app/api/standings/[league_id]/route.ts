// cspell:disable
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ league_id: string }> }) {
  try {
    const params = await props.params;
    const leagueId = params.league_id;
    
    if (!leagueId) {
      return NextResponse.json({ error: "Missing league_id" }, { status: 400 });
    }

    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY in .env.local");
    }

    // Requête vers APIFootball pour le classement de la ligue
    const url = `https://apiv3.apifootball.com/?action=get_standings&league_id=${leagueId}&APIkey=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      next: { revalidate: 3600 } // Cache d'une heure car les classements changent peu souvent
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // S'il y a une erreur dans le payload APIFootball
    if (data.error) {
       return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ standings: data || [] });

  } catch (error: unknown) {
    console.error('Erreur Proxy Standings APIFootball:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
