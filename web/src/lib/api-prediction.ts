export interface PredictionResult {
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  advice: string;
  winProbabilities: {
    home: number;
    draw: number;
    away: number;
  };
  expectedScore: string;
}

/**
 * Mocks a prediction response while the real API is being connected.
 */
function getMockPrediction(homeTeam: string, awayTeam: string): PredictionResult {
  // Generate random stable probabilities based on team names length for mock
  const sum = homeTeam.length + awayTeam.length;
  const homeProb = Math.min(80, Math.max(20, 30 + (homeTeam.length * 2)));
  const drawProb = Math.min(40, Math.max(10, 25 + (sum % 10)));
  const awayProb = 100 - homeProb - drawProb;

  return {
    matchDate: new Date().toISOString(),
    homeTeam,
    awayTeam,
    advice: homeProb > awayProb ? `Victoire probable de ${homeTeam}` : `Victoire probable de ${awayTeam}`,
    winProbabilities: {
      home: homeProb,
      draw: drawProb,
      away: awayProb,
    },
    expectedScore: `${Math.floor(homeProb / 20)} - ${Math.floor(awayProb / 20)}`
  };
}

/**
 * Fetches the match prediction from the Today Football Prediction API.
 * For now, returns mock data until user provides the real RapidAPI Key.
 */
export async function getMatchPrediction(homeTeam: string, awayTeam: string, dateStr?: string): Promise<PredictionResult | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    console.warn("RAPIDAPI_KEY is not defined. Falling back to mock prediction.");
    // Small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockPrediction(homeTeam, awayTeam);
  }

  try {
    // NOTE: This logic might need adjustment depending on the exact JSON schema of the API.
    // The current implementation searches the daily list and fetches details.
    const response = await fetch(`https://today-football-prediction.p.rapidapi.com/predictions/list?page=1`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'today-football-prediction.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error("Failed to fetch predictions from RapidAPI");
      return getMockPrediction(homeTeam, awayTeam);
    }

    const data = await response.json();
    
    // In a real scenario, we'd find the exact match from data.predictions using dateStr and teams
    // console.log("Fetched predictions for", dateStr, data);

    // For now we will return mock since we don't have the exact structure
    return getMockPrediction(homeTeam, awayTeam);

  } catch (error) {
    console.error("Error fetching prediction:", error);
    return getMockPrediction(homeTeam, awayTeam);
  }
}
