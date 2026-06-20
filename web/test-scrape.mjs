import * as cheerio from 'cheerio';

async function test() {
  console.log("Fetching main page...");
  const html = await (await fetch('https://www.aminnasritv.xyz')).text();
  const $ = cheerio.load(html);

  const matches = [];
  
  $('.EventBox').each((i, el) => {
    const $el = $(el);
    const link = $el.find('.EventCover').attr('href');
    const team1 = $el.find('.EventTeam.Right .EventTeamName').text().trim();
    const team1Logo = $el.find('.EventTeam.Right .EventTeamLogo img').attr('src');
    
    const team2 = $el.find('.EventTeam.Left .EventTeamName').text().trim();
    const team2Logo = $el.find('.EventTeam.Left .EventTeamLogo img').attr('src');
    
    const time = $el.find('#EventHour').text().trim();
    const status = $el.find('.EventDate').text().trim(); // "Live", "18:00", etc.
    const league = $el.find('.EventLeague').text().trim();
    const commentator = $el.find('.EventFooter li').first().text().trim();

    matches.push({
      id: i,
      team1, team1Logo,
      team2, team2Logo,
      time, status, league,
      commentator,
      url: link
    });
  });

  console.log(matches.slice(0, 3));

  if (matches[0] && matches[0].url) {
    console.log("Fetching match page...", matches[0].url);
    const matchHtml = await (await fetch(matches[0].url)).text();
    const $m = cheerio.load(matchHtml);
    
    const servers = [];
    $m('.video-player iframe').each((i, el) => {
      servers.push($m(el).attr('src'));
    });
    console.log("Servers found:", servers);
  }
}

test().catch(console.error);
