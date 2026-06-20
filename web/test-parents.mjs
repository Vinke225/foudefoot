import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const html = fs.readFileSync('aminnasritv.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('.EventBox').each((i, el) => {
    let parentId = $(el).closest('div[id]').attr('id');
    console.log(`EventBox ${i} parent ID: ${parentId}`);
  });
}

test().catch(console.error);
