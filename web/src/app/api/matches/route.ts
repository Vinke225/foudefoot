import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day') || 'today';
  
  let targetUrl = 'https://www.aminnasritv.xyz';
  if (day === 'yesterday') targetUrl = 'https://www.aminnasritv.xyz/p/yesterday-matches.html';
  if (day === 'tomorrow') targetUrl = 'https://www.aminnasritv.xyz/p/tomorrow-matches.html';

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 } // cache for 60 seconds
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches: any[] = [];

    $('.EventBox').each((i, el) => {
      const $el = $(el);
      const link = $el.find('a#EventLink').attr('href');
      
      const team1 = $el.find('.EventTeam.Right .EventTeamName').text().trim();
      const team1Logo = $el.find('.EventTeam.Right .EventTeamLogo img').attr('data-src') || $el.find('.EventTeam.Right .EventTeamLogo img').attr('src');
      
      const team2 = $el.find('.EventTeam.Left .EventTeamName').text().trim();
      const team2Logo = $el.find('.EventTeam.Left .EventTeamLogo img').attr('data-src') || $el.find('.EventTeam.Left .EventTeamLogo img').attr('src');
      
      const time = $el.find('#EventHour').text().trim();
      const status = $el.find('.EventDate').text().trim();
      const league = $el.find('.EventLeague').text().trim();
      const commentator = $el.find('.EventFooter li').first().text().trim();

      if (team1 && team2) {
        matches.push({
          id: i.toString(),
          team1, 
          team1Logo: team1Logo?.startsWith('//') ? 'https:' + team1Logo : team1Logo,
          team2, 
          team2Logo: team2Logo?.startsWith('//') ? 'https:' + team2Logo : team2Logo,
          time, status, league,
          commentator,
          url: link
        });
      }
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('API /matches error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
