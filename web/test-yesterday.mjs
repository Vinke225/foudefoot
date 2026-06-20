import * as cheerio from 'cheerio';

async function test() {
  const html = await (await fetch('https://www.aminnasritv.xyz/p/yesterday-matches.html')).text();
  const $ = cheerio.load(html);
  console.log("EventBox count:", $('.EventBox').length);
}

test().catch(console.error);
