import type { Airport } from "@/lib/types";

/** 只用于首页筛选，不参与排队时间估算。 */
export type RegionId = "europe" | "asia" | "americas" | "oceania";

export const REGION_FILTERS: { id: RegionId | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "europe", label: "欧洲" },
  { id: "asia", label: "亚洲" },
  { id: "americas", label: "美洲" },
  { id: "oceania", label: "大洋洲" },
];

const REGION_LABEL: Record<RegionId, string> = {
  europe: "欧洲",
  asia: "亚洲",
  americas: "美洲",
  oceania: "大洋洲",
};

const BY_COUNTRY: Record<string, RegionId> = {
  Spain: "europe",
  "United Kingdom": "europe",
  France: "europe",
  Netherlands: "europe",
  Germany: "europe",
  Italy: "europe",
  Portugal: "europe",
  Switzerland: "europe",
  "Türkiye": "europe",
  "United Arab Emirates": "asia",
  Singapore: "asia",
  "Hong Kong SAR, China": "asia",
  Japan: "asia",
  "South Korea": "asia",
  China: "asia",
  "United States": "americas",
  Australia: "oceania",
};

export function airportRegion(airport: Airport): RegionId | null {
  return BY_COUNTRY[airport.country] ?? null;
}

export function regionLabel(airport: Airport): string {
  const id = airportRegion(airport);
  return id ? REGION_LABEL[id] : "";
}
