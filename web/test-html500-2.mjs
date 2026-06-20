import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const html = fs.readFileSync('aminnasritv.html', 'utf8');
  const $ = cheerio.load(html);
  console.log("HTML500 content:", $('#HTML500').html());
}

test().catch(console.error);
