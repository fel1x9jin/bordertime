import type { ActiveTimer, Report } from "./types";

const REPORTS_KEY = "bordertime:user-reports:v1";
const TIMER_KEY = "bordertime:timer:v1";
const MAX_STORED_REPORTS = 200;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null; // 隐私模式或数据损坏时，当作没有数据
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储失败时静默忽略，页面仍可使用
  }
}

function isReport(value: unknown): value is Report {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.airportCode === "string" &&
    (r.direction === "departure" || r.direction === "arrival") &&
    typeof r.createdAt === "number"
  );
}

export function loadUserReports(): Report[] {
  const data = read<unknown>(REPORTS_KEY);
  if (!Array.isArray(data)) return [];
  // 兼容旧数据：旧报告没有拆分字段
  return data.filter(isReport).map((r) => ({
    ...r,
    waitMinutes: r.waitMinutes ?? null,
    queueMinutes: r.queueMinutes ?? null,
    processingMinutes: r.processingMinutes ?? null,
  }));
}

export function saveUserReports(reports: Report[]): void {
  write(REPORTS_KEY, reports.slice(-MAX_STORED_REPORTS));
}

export function loadTimer(): ActiveTimer | null {
  const t = read<ActiveTimer>(TIMER_KEY);
  if (
    t &&
    typeof t.airportCode === "string" &&
    (t.direction === "departure" || t.direction === "arrival") &&
    typeof t.startedAt === "number"
  ) {
    return {
      ...t,
      reachedDeskAt: typeof t.reachedDeskAt === "number" ? t.reachedDeskAt : null,
      endedAt: typeof t.endedAt === "number" ? t.endedAt : null,
    };
  }
  return null;
}

export function saveTimer(timer: ActiveTimer): void {
  write(TIMER_KEY, timer);
}

export function clearTimer(): void {
  try {
    window.localStorage.removeItem(TIMER_KEY);
  } catch {
    // 忽略
  }
}
