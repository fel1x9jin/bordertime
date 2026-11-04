import { AIRPORTS } from "./airports";
import type { Airport } from "@/lib/types";

/**
 * 列表里这些机场之间长期有民航往来的城市对。
 * 用来画航线，不是实时雷达，也不代表此刻真有一架飞机在这个位置。
 */
export const FLIGHT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["LHR", "CDG"], ["LHR", "AMS"], ["LHR", "FRA"], ["LHR", "MUC"], ["LHR", "MAD"],
  ["LHR", "BCN"], ["LHR", "FCO"], ["LHR", "MXP"], ["LHR", "LIS"], ["LHR", "ZRH"],
  ["LHR", "IST"], ["LHR", "DXB"], ["LHR", "DOH"], ["LHR", "JFK"], ["LHR", "ORD"],
  ["LHR", "LAX"], ["LHR", "SFO"], ["LHR", "YVR"], ["LHR", "SIN"], ["LHR", "HKG"],
  ["LHR", "BKK"], ["LHR", "NRT"], ["LHR", "ICN"], ["LHR", "PVG"], ["LHR", "PEK"],
  ["LHR", "CAN"], ["LHR", "SYD"], ["LHR", "MEL"],
  ["CDG", "AMS"], ["CDG", "FRA"], ["CDG", "MUC"], ["CDG", "FCO"], ["CDG", "MAD"],
  ["CDG", "BCN"], ["CDG", "LIS"], ["CDG", "ZRH"], ["CDG", "IST"], ["CDG", "DXB"],
  ["CDG", "DOH"], ["CDG", "JFK"], ["CDG", "LAX"], ["CDG", "SIN"], ["CDG", "HKG"],
  ["CDG", "BKK"], ["CDG", "NRT"], ["CDG", "ICN"], ["CDG", "PVG"], ["CDG", "PEK"],
  ["CDG", "CAN"],
  ["AMS", "FRA"], ["AMS", "MAD"], ["AMS", "BCN"], ["AMS", "FCO"], ["AMS", "LIS"],
  ["AMS", "ZRH"], ["AMS", "DXB"], ["AMS", "JFK"], ["AMS", "SIN"], ["AMS", "KUL"],
  ["AMS", "ICN"], ["AMS", "PVG"], ["AMS", "CAN"],
  ["FRA", "MUC"], ["FRA", "FCO"], ["FRA", "MAD"], ["FRA", "ZRH"], ["FRA", "IST"],
  ["FRA", "DXB"], ["FRA", "DOH"], ["FRA", "JFK"], ["FRA", "ORD"], ["FRA", "SFO"],
  ["FRA", "SIN"], ["FRA", "HKG"], ["FRA", "BKK"], ["FRA", "NRT"], ["FRA", "ICN"],
  ["FRA", "PVG"], ["FRA", "PEK"], ["FRA", "CAN"], ["FRA", "TFU"],
  ["MAD", "BCN"], ["MAD", "LIS"], ["MAD", "FCO"], ["MAD", "MXP"], ["MAD", "DOH"],
  ["FCO", "MXP"], ["FCO", "IST"], ["ZRH", "IST"], ["ZRH", "DXB"],
  ["IST", "DXB"], ["IST", "DOH"], ["IST", "JFK"], ["IST", "SIN"], ["IST", "BKK"],
  ["IST", "HKG"], ["IST", "ICN"], ["IST", "PVG"], ["IST", "CAN"], ["IST", "JED"],
  ["IST", "RUH"],
  ["JED", "RUH"], ["JED", "DXB"], ["JED", "DOH"], ["JED", "LHR"], ["JED", "CDG"],
  ["JED", "FRA"], ["RUH", "DXB"], ["RUH", "DOH"], ["RUH", "LHR"], ["RUH", "CDG"],
  ["RUH", "FRA"],
  ["DXB", "DOH"], ["DXB", "SIN"], ["DXB", "HKG"], ["DXB", "BKK"], ["DXB", "KUL"],
  ["DXB", "SYD"], ["DXB", "MEL"], ["DXB", "JFK"], ["DXB", "PVG"], ["DXB", "PEK"],
  ["DXB", "CAN"], ["DXB", "ICN"], ["DXB", "NRT"], ["DXB", "TFU"], ["DXB", "CKG"],
  ["DOH", "SIN"], ["DOH", "BKK"], ["DOH", "HKG"], ["DOH", "KUL"], ["DOH", "SYD"],
  ["DOH", "MEL"], ["DOH", "JFK"], ["DOH", "PVG"], ["DOH", "CAN"], ["DOH", "ICN"],
  ["DOH", "TFU"],
  ["JFK", "LAX"], ["JFK", "SFO"], ["JFK", "ORD"], ["LAX", "SFO"], ["LAX", "ORD"],
  ["SFO", "ORD"], ["SFO", "YVR"], ["LAX", "YVR"],
  ["NRT", "LAX"], ["NRT", "SFO"], ["NRT", "JFK"], ["NRT", "ORD"], ["NRT", "YVR"],
  ["NRT", "ICN"], ["NRT", "PVG"], ["NRT", "PEK"], ["NRT", "CAN"], ["NRT", "HGH"],
  ["NRT", "HKG"], ["NRT", "BKK"], ["NRT", "SIN"], ["NRT", "SYD"],
  ["ICN", "LAX"], ["ICN", "SFO"], ["ICN", "JFK"], ["ICN", "ORD"], ["ICN", "YVR"],
  ["ICN", "PVG"], ["ICN", "PEK"], ["ICN", "CAN"], ["ICN", "SZX"], ["ICN", "HGH"],
  ["ICN", "HKG"], ["ICN", "BKK"], ["ICN", "SIN"], ["ICN", "SYD"], ["ICN", "TFU"],
  ["ICN", "CKG"],
  ["PVG", "PEK"], ["PVG", "CAN"], ["PVG", "SZX"], ["PVG", "TFU"], ["PVG", "CKG"],
  ["PVG", "HGH"], ["PVG", "HKG"], ["PVG", "SIN"], ["PVG", "BKK"],
  ["PVG", "KUL"], ["PVG", "NRT"], ["PVG", "ICN"], ["PVG", "LAX"], ["PVG", "SFO"],
  ["PVG", "JFK"], ["PVG", "YVR"], ["PVG", "SYD"], ["PVG", "MEL"], ["PVG", "ORD"],
  ["PEK", "CAN"], ["PEK", "SZX"], ["PEK", "TFU"], ["PEK", "CKG"], ["PEK", "HGH"],
  ["PEK", "HKG"], ["PEK", "SIN"], ["PEK", "BKK"], ["PEK", "NRT"],
  ["PEK", "ICN"], ["PEK", "LAX"], ["PEK", "SFO"], ["PEK", "YVR"], ["PEK", "SYD"],
  ["CAN", "SZX"], ["CAN", "TFU"], ["CAN", "CKG"], ["CAN", "HGH"],
  ["CAN", "HKG"], ["CAN", "BKK"], ["CAN", "SIN"], ["CAN", "KUL"], ["CAN", "ICN"],
  ["CAN", "NRT"], ["CAN", "SYD"], ["CAN", "MEL"], ["CAN", "LAX"], ["CAN", "SFO"],
  ["CAN", "JFK"], ["CAN", "YVR"],
  ["SZX", "HKG"], ["SZX", "BKK"], ["SZX", "SIN"],
  ["SZX", "KUL"], ["SZX", "NRT"],
  ["TFU", "HKG"], ["TFU", "BKK"], ["TFU", "SIN"], ["TFU", "LHR"], ["CKG", "HKG"],
  ["CKG", "BKK"], ["CKG", "SIN"], ["HGH", "HKG"], ["HGH", "SIN"], ["HGH", "BKK"],
  ["SIN", "HKG"], ["SIN", "BKK"], ["SIN", "KUL"], ["SIN", "SYD"], ["SIN", "MEL"],
  ["SIN", "SFO"], ["BKK", "HKG"], ["BKK", "KUL"], ["BKK", "SYD"], ["BKK", "MEL"],
  ["KUL", "HKG"], ["KUL", "SYD"], ["KUL", "MEL"], ["HKG", "SYD"], ["HKG", "MEL"],
  ["HKG", "JFK"], ["HKG", "LAX"], ["HKG", "SFO"], ["HKG", "YVR"], ["SYD", "MEL"],
  ["SYD", "LAX"], ["MEL", "LAX"],
];

/** 没点中机场时，先飞这几条洲际航线。 */
export const SHOWCASE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["CAN", "LHR"],
  ["PVG", "JFK"],
  ["HKG", "SYD"],
  ["DXB", "MEL"],
  ["NRT", "LAX"],
  ["DOH", "JFK"],
  ["ICN", "ORD"],
  ["BKK", "FRA"],
  ["YVR", "PEK"],
  ["CDG", "NRT"],
  ["SFO", "SIN"],
  ["CAN", "SYD"],
];

const BY_CODE = new Map(AIRPORTS.map((airport) => [airport.code, airport]));

function distanceKm(a: Airport, b: Airport): number {
  const earth = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type DirectedRoute = {
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

function direct(fromCode: string, toCode: string): DirectedRoute | null {
  const from = BY_CODE.get(fromCode);
  const to = BY_CODE.get(toCode);
  if (!from || !to) return null;
  return {
    from: from.code,
    to: to.code,
    fromCity: from.cityZh,
    toCity: to.cityZh,
    startLat: from.lat,
    startLng: from.lng,
    endLat: to.lat,
    endLng: to.lng,
  };
}

/** 点中某个机场时，从这里出发，远近航线都留一些。 */
export function routesFromAirport(code: string, limit: number): DirectedRoute[] {
  const seen = new Set<string>();
  const touching: DirectedRoute[] = [];
  for (const [a, b] of FLIGHT_PAIRS) {
    if (a !== code && b !== code) continue;
    const key = [a, b].sort().join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    const route = a === code ? direct(a, b) : direct(b, a);
    if (route) touching.push(route);
  }

  if (touching.length <= limit) return touching;

  const ranked = [...touching].sort((left, right) => {
    const leftKm = distanceKm(BY_CODE.get(left.from)!, BY_CODE.get(left.to)!);
    const rightKm = distanceKm(BY_CODE.get(right.from)!, BY_CODE.get(right.to)!);
    return rightKm - leftKm;
  });
  const longCount = Math.ceil(limit / 2);
  const picked = [...ranked.slice(0, longCount), ...ranked.slice(-(limit - longCount))];
  const pickedKeys = new Set<string>();
  const unique: DirectedRoute[] = [];
  for (const route of picked) {
    const key = `${route.from}-${route.to}`;
    if (pickedKeys.has(key)) continue;
    pickedKeys.add(key);
    unique.push(route);
  }
  return unique.slice(0, limit);
}

export function showcaseRoutes(limit: number): DirectedRoute[] {
  return SHOWCASE_PAIRS.slice(0, limit)
    .map(([from, to]) => direct(from, to))
    .filter((route): route is DirectedRoute => route !== null);
}
