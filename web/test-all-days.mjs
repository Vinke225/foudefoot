import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const html = fs.readFileSync('aminnasritv.html', 'utf8');
  const $ = cheerio.load(html);
  console.log("Yesterday count:", $('#yesterday .EventBox').length);
  console.log("Today count:", $('#today .EventBox').length);
  console.log("Tomorrow count:", $('#tomorrow .EventBox').length);
}

test().catch(console.error);
