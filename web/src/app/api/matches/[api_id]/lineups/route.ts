// cspell:disable
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ api_id: string }> }) {
  try {
    const params = await props.params;
    const apiId = params.api_id;
    if (!apiId) {
      return NextResponse.json({ error: "Missing api_id" }, { status: 400 });
    }

    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
      throw new Error("Missing APIFOOTBALL_KEY");
    }

    const url = `https://apiv3.apifootball.com/?action=get_events&match_id=${apiId}&APIkey=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      next: { revalidate: 600 } // Les compos changent peu, cache de 10 min
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
       return NextResponse.json({ error: data.message }, { status: 400 });
    }

    const match = Array.isArray(data) ? data[0] : null;
    if (!match) {
       return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ lineup: match.lineup || null });

  } catch (error: unknown) {
    console.error('Erreur Proxy Lineups APIFootball:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
