require('dotenv').config();
const apiKey = process.env.APIFOOTBALL_KEY;
const importantLeagues = [1];
let allFixtures = [];

fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2022', {
  method: 'GET',
  headers: {
    'x-apisports-key': apiKey,
  }
}).then(res => res.json()).then(data => {
  allFixtures = data.response;
  
  const matchesToInsert = allFixtures
    .filter(fixture => fixture.fixture && fixture.teams && fixture.league)
    .filter(fixture => importantLeagues.includes(fixture.league.id))
    .filter(fixture => {
      const home = fixture.teams.home.name;
      const away = fixture.teams.away.name;
      const isYouth = /\bU\d{2}\b/i.test(home) || /\bU\d{2}\b/i.test(away);
      return !isYouth;
    });
    
  console.log('matchesToInsert length:', matchesToInsert.length);
});
