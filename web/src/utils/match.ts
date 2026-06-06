export function getMatchSlug(match: { home_team: string; away_team: string; api_id?: string | null; id: string }) {
  if (!match.api_id) return match.id;
  const cleanHome = match.home_team.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanAway = match.away_team.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${cleanHome}-vs-${cleanAway}-${match.api_id}`;
}
