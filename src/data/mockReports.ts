import type { Crowd, Direction, Report } from "@/lib/types";

/**
 * 模拟示例报告：只用于第一阶段演示界面，不是真实旅客提交的数据。
 * 界面上会明确标注“模拟示例”。没有出现在这里的机场，会显示“暂无数据”。
 */
interface Seed {
  airportCode: string;
  direction: Direction;
  waitMinutes: number | null;
  crowd: Crowd | null;
  minutesAgo: number;
}

const SEEDS: Seed[] = [
  // 巴塞罗那
  { airportCode: "BCN", direction: "departure", waitMinutes: 12, crowd: "light", minutesAgo: 8 },
  { airportCode: "BCN", direction: "departure", waitMinutes: 18, crowd: "moderate", minutesAgo: 25 },
  { airportCode: "BCN", direction: "departure", waitMinutes: null, crowd: "moderate", minutesAgo: 40 },
  { airportCode: "BCN", direction: "departure", waitMinutes: 9, crowd: "light", minutesAgo: 250 },
  { airportCode: "BCN", direction: "arrival", waitMinutes: 22, crowd: "moderate", minutesAgo: 6 },
  { airportCode: "BCN", direction: "arrival", waitMinutes: 35, crowd: "heavy", minutesAgo: 18 },
  { airportCode: "BCN", direction: "arrival", waitMinutes: 28, crowd: "moderate", minutesAgo: 47 },
  { airportCode: "BCN", direction: "arrival", waitMinutes: 41, crowd: "heavy", minutesAgo: 95 },
  // 马德里
  { airportCode: "MAD", direction: "arrival", waitMinutes: 30, crowd: "heavy", minutesAgo: 12 },
  { airportCode: "MAD", direction: "arrival", waitMinutes: 25, crowd: "moderate", minutesAgo: 33 },
  { airportCode: "MAD", direction: "arrival", waitMinutes: 38, crowd: "heavy", minutesAgo: 70 },
  { airportCode: "MAD", direction: "departure", waitMinutes: 8, crowd: "light", minutesAgo: 55 },
  // 伦敦希思罗
  { airportCode: "LHR", direction: "arrival", waitMinutes: 55, crowd: "heavy", minutesAgo: 5 },
  { airportCode: "LHR", direction: "arrival", waitMinutes: 48, crowd: "heavy", minutesAgo: 22 },
  { airportCode: "LHR", direction: "arrival", waitMinutes: 62, crowd: "heavy", minutesAgo: 41 },
  { airportCode: "LHR", direction: "arrival", waitMinutes: 40, crowd: "moderate", minutesAgo: 120 },
  { airportCode: "LHR", direction: "departure", waitMinutes: 10, crowd: "light", minutesAgo: 15 },
  { airportCode: "LHR", direction: "departure", waitMinutes: 14, crowd: "light", minutesAgo: 60 },
  // 其他
  { airportCode: "CDG", direction: "arrival", waitMinutes: 26, crowd: "moderate", minutesAgo: 10 },
  { airportCode: "CDG", direction: "arrival", waitMinutes: null, crowd: "moderate", minutesAgo: 29 },
  { airportCode: "JFK", direction: "arrival", waitMinutes: 70, crowd: "heavy", minutesAgo: 14 },
  { airportCode: "JFK", direction: "arrival", waitMinutes: 85, crowd: "heavy", minutesAgo: 38 },
  { airportCode: "JFK", direction: "arrival", waitMinutes: 60, crowd: "heavy", minutesAgo: 66 },
  { airportCode: "DXB", direction: "departure", waitMinutes: 6, crowd: "light", minutesAgo: 20 },
  { airportCode: "DXB", direction: "departure", waitMinutes: 9, crowd: "light", minutesAgo: 75 },
  { airportCode: "FCO", direction: "arrival", waitMinutes: 15, crowd: "light", minutesAgo: 30 },
  { airportCode: "SIN", direction: "arrival", waitMinutes: 7, crowd: "light", minutesAgo: 12 },
  { airportCode: "SIN", direction: "arrival", waitMinutes: 5, crowd: "light", minutesAgo: 50 },
];

/** base 是页面加载的时间；每条报告的时间 = base 往前推 minutesAgo 分钟 */
export function buildMockReports(base: number): Report[] {
  return SEEDS.map((s, i) => ({
    id: `mock-${i}`,
    airportCode: s.airportCode,
    direction: s.direction,
    waitMinutes: s.waitMinutes,
    queueMinutes: null,
    processingMinutes: null,
    crowd: s.crowd,
    createdAt: base - s.minutesAgo * 60_000,
    source: "mock",
  }));
}
