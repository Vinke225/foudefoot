// cspell:disable
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ team_id: string }> }) {
  try {
    const params = await props.params;
    const teamId = params.team_id;
    
    if (!teamId) {
      return NextResponse.json({ error: "Missing team_id" }, { status: 400 });
    }

    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY in .env.local");
    }

    // Requête vers APIFootball pour les détails de l'équipe
    const url = `https://apiv3.apifootball.com/?action=get_teams&team_id=${teamId}&APIkey=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      next: { revalidate: 86400 } // Cache de 24h car les effectifs changent très rarement hors mercato
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // S'il y a une erreur dans le payload APIFootball
    if (data.error) {
       return NextResponse.json({ error: data.message }, { status: 400 });
    }

    // get_teams renvoie un tableau contenant un seul objet (l'équipe)
    const teamData = Array.isArray(data) ? data[0] : null;

    if (!teamData) {
        return NextResponse.json({ error: "Équipe introuvable" }, { status: 404 });
    }

    return NextResponse.json({ team: teamData });

  } catch (error: unknown) {
    console.error('Erreur Proxy Teams APIFootball:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
