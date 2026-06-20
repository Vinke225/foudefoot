import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch servers' }, { status: res.status });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const servers: { name: string, url: string }[] = [];

    // Extracting generic iframes
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('google') && !src.includes('doubleclick') && !src.includes('facebook') && !src.includes('twitter')) {
        servers.push({
          name: `Serveur ${servers.length + 1}`,
          url: src.startsWith('//') ? 'https:' + src : src
        });
      }
    });

    // Extracting from tab contents
    $('.tab-content').each((i, el) => {
      const src = $(el).attr('data-src');
      const id = $(el).attr('id') || `Serveur ${servers.length + 1}`;
      if (src && !src.includes('google') && !src.includes('doubleclick') && !src.includes('facebook') && !src.includes('twitter')) {
        servers.push({
          name: id,
          url: src.startsWith('//') ? 'https:' + src : src
        });
      }
    });

    // Remove duplicates
    const uniqueServers = Array.from(new Map(servers.map(item => [item.url, item])).values());

    return NextResponse.json(uniqueServers);
  } catch (error) {
    console.error('API /servers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
