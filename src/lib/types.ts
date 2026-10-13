export type Direction = "departure" | "arrival";
export type Crowd = "light" | "moderate" | "heavy";
// mock：本地模拟示例；user：本机演示模式下提交的；remote：来自 Supabase 的旅客报告
export type ReportSource = "mock" | "user" | "remote";

export interface Airport {
  code: string;
  name: string;
  nameZh: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
}

/**
 * 一条用户报告。
 * waitMinutes 是「用户报告的排队耗时」，不是官方数据。
 */
export interface Report {
  id: string;
  airportCode: string;
  direction: Direction;
  waitMinutes: number | null; // 排队到通过的总耗时；只提交拥挤程度时为 null
  queueMinutes: number | null; // 排队到窗口前（点了「我到窗口了」才有）
  processingMinutes: number | null; // 窗口办理（同上）
  crowd: Crowd | null;
  createdAt: number; // 毫秒时间戳
  source: ReportSource;
}

export interface ActiveTimer {
  airportCode: string;
  direction: Direction;
  startedAt: number;
  reachedDeskAt: number | null; // 点「我到窗口了」的时间，可选
  endedAt: number | null; // null 表示仍在计时
}

export const DIRECTIONS: Direction[] = ["departure", "arrival"];

export const DIRECTION_LABEL: Record<Direction, string> = {
  departure: "出境边检",
  arrival: "入境边检",
};

export const CROWD_LABEL: Record<Crowd, string> = {
  light: "不拥挤",
  moderate: "一般",
  heavy: "很拥挤",
};

export const CROWD_HINT: Record<Crowd, string> = {
  light: "基本不用排队",
  moderate: "需要排一会儿",
  heavy: "队伍很长",
};

export const CROWD_STYLE: Record<Crowd, string> = {
  light: "bg-ok/10 text-ok",
  moderate: "bg-warn/10 text-warn",
  heavy: "bg-bad/10 text-bad",
};
