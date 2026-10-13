import type { Airport } from "./types";

/** 按三字码、机场名、城市、国家（中英文）搜索 */
export function searchAirports(airports: Airport[], query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return airports;

  const scored: { airport: Airport; score: number }[] = [];
  for (const a of airports) {
    const code = a.code.toLowerCase();
    const fields = [a.name, a.nameZh, a.city, a.cityZh, a.country, a.countryZh];
    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (fields.some((f) => f.toLowerCase().includes(q))) score = 2;
    if (score >= 0) scored.push({ airport: a, score });
  }
  return scored.sort((x, y) => x.score - y.score).map((s) => s.airport);
}
