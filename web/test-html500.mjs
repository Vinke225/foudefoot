import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const html = fs.readFileSync('aminnasritv.html', 'utf8');
  const $ = cheerio.load(html);
  console.log("Yesterday HTML:", $('#yesterday').html());
}

test().catch(console.error);
