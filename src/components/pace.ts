/** 状态点只反映已算出的中位数落在哪一档，不改变估算本身。 */
export type Pace = "fast" | "mid" | "slow" | "none";

export const PACE: Record<Pace, { dot: string; hex: string; text: string; label: string }> = {
  fast: { dot: "bg-[#1C8C4E]", hex: "#1C8C4E", text: "text-ok", label: "较快" },
  mid: { dot: "bg-[#F0B400]", hex: "#F0B400", text: "text-warn", label: "中等" },
  slow: { dot: "bg-[#D23B2F]", hex: "#D23B2F", text: "text-bad", label: "较慢" },
  none: { dot: "bg-slate-300", hex: "#C5CDD6", text: "text-slate-500", label: "暂无数据" },
};

export function paceOf(minutes: number | null): Pace {
  if (minutes === null) return "none";
  if (minutes <= 15) return "fast";
  if (minutes <= 35) return "mid";
  return "slow";
}

/** 地球仪上的圆点：两边都没数据时为灰，否则取较慢的一边。 */
export function markerHex(departure: number | null, arrival: number | null): string {
  const rank: Record<Pace, number> = { none: 0, fast: 1, mid: 2, slow: 3 };
  const a = paceOf(departure);
  const b = paceOf(arrival);
  return PACE[rank[a] >= rank[b] ? a : b].hex;
}
