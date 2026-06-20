import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const html = fs.readFileSync('yesterday.html', 'utf8');
  const $ = cheerio.load(html);
  console.log("HTML500 content in yesterday.html:", $('#HTML500').html());
}

test().catch(console.error);
