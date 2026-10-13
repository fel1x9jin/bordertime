import type { Crowd, Report } from "./types";

/** 只有最近 3 小时内的报告才计入估算 */
export const VALID_WINDOW_MS = 3 * 60 * 60 * 1000;

export interface Summary {
  validCount: number; // 有效报告数量
  timedCount: number; // 其中带计时数据的数量
  mockCount: number; // 其中模拟示例的数量
  medianMinutes: number | null; // 无计时数据时为 null，界面显示“暂无数据”
  lastUpdated: number | null;
  latestCrowd: Crowd | null;
}

export function summarize(reports: Report[], now: number): Summary {
  const valid = reports.filter((r) => now - r.createdAt <= VALID_WINDOW_MS);

  const minutes = valid
    .map((r) => r.waitMinutes)
    .filter((m): m is number => m !== null)
    .sort((a, b) => a - b);

  let median: number | null = null;
  if (minutes.length > 0) {
    const mid = Math.floor(minutes.length / 2);
    median =
      minutes.length % 2 === 1
        ? minutes[mid]
        : Math.round((minutes[mid - 1] + minutes[mid]) / 2);
  }

  const newestFirst = [...valid].sort((a, b) => b.createdAt - a.createdAt);
  const latestWithCrowd = newestFirst.find((r) => r.crowd !== null);

  return {
    validCount: valid.length,
    timedCount: minutes.length,
    mockCount: valid.filter((r) => r.source === "mock").length,
    medianMinutes: median,
    lastUpdated: newestFirst.length > 0 ? newestFirst[0].createdAt : null,
    latestCrowd: latestWithCrowd ? latestWithCrowd.crowd : null,
  };
}
