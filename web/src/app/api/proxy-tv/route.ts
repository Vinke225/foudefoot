import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.aminnasritv.xyz', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch Live TV', { status: res.status });
    }

    let html = await res.text();

    // Inject base href to fix relative resources
    html = html.replace('<head>', '<head><base href="https://www.aminnasritv.xyz/">');

    // Inject CSS to crop the view and block ads
    const customCss = `
      <style>
        /* Hide Header, Footer and Menus */
        header, .SiteHeader, #SiteHeader, footer, .Bottom-Footer, .Top-Footer, .SiteLogo, .SiteMenu {
          display: none !important;
        }
        
        /* Hide Ads and Popups */
        .MW-Ads, .mw-adblock, .Post-ads, .ad-zone-1, .mw-cookie-wrapper, [class*="adblock"], [id*="adblock"] {
          display: none !important;
        }

        /* Hide body background padding/margins to make it look native */
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
        }
        
        /* Fix scrollbars inside iframe */
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      </style>
    `;

    html = html.replace('</head>', `${customCss}</head>`);

    // Return the modified HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error proxying Live TV:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
