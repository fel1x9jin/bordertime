"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildMockReports } from "@/data/mockReports";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { loadUserReports, saveUserReports } from "./storage";
import type { Crowd, Direction, Report } from "./types";

export type SubmitResult = "ok" | "rate_limited" | "error";

export type NewReport = Omit<Report, "id" | "createdAt" | "source">;

/** 读取最近 24 小时的报告；估算时只用其中最近 3 小时的 */
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

interface ReportRow {
  id: string;
  airport_code: string;
  direction: Direction;
  wait_minutes: number | null;
  queue_minutes: number | null;
  processing_minutes: number | null;
  crowd: Crowd | null;
  created_at: string;
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    airportCode: row.airport_code,
    direction: row.direction,
    waitMinutes: row.wait_minutes,
    queueMinutes: row.queue_minutes,
    processingMinutes: row.processing_minutes,
    crowd: row.crowd,
    createdAt: Date.parse(row.created_at),
    source: "remote",
  };
}

/**
 * 读取并提交报告。
 * - 配置了 Supabase：读写线上数据库，不再显示任何模拟数据。
 * - 没配置：退回本地演示模式（模拟示例 + 保存在本机浏览器的报告）。
 */
export function useReports() {
  const [now, setNow] = useState<number | null>(null);
  const [mockBase, setMockBase] = useState<number | null>(null);
  const [localReports, setLocalReports] = useState<Report[]>([]);
  const [remoteReports, setRemoteReports] = useState<Report[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchRemote = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
    const { data, error } = await supabase
      .from("reports")
      .select(
        "id, airport_code, direction, wait_minutes, queue_minutes, processing_minutes, crowd, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !data) {
      setSyncError("暂时无法从服务器读取报告，请稍后刷新页面再试。");
    } else {
      setSyncError(null);
      setRemoteReports((data as ReportRow[]).map(rowToReport));
    }
    setRemoteLoaded(true);
  }, []);

  useEffect(() => {
    const t = Date.now();
    setNow(t);

    if (isSupabaseConfigured) {
      void fetchRemote();
      const id = setInterval(() => {
        setNow(Date.now());
        void fetchRemote();
      }, 60_000);
      return () => clearInterval(id);
    }

    setMockBase(t);
    setLocalReports(loadUserReports());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [fetchRemote]);

  const mockReports = useMemo(
    () => (mockBase === null ? [] : buildMockReports(mockBase)),
    [mockBase],
  );

  const reports = useMemo(
    () =>
      isSupabaseConfigured
        ? remoteReports
        : [...mockReports, ...localReports],
    [mockReports, localReports, remoteReports],
  );

  /** 返回提交结果，界面据此显示不同提示 */
  const addReport = useCallback(
    async (input: NewReport): Promise<SubmitResult> => {
      const supabase = getSupabase();

      if (supabase) {
        const { error } = await supabase.from("reports").insert({
          airport_code: input.airportCode,
          direction: input.direction,
          wait_minutes: input.waitMinutes,
          queue_minutes: input.queueMinutes,
          processing_minutes: input.processingMinutes,
          crowd: input.crowd,
        });
        if (error) {
          return error.message.includes("rate_limited")
            ? "rate_limited"
            : "error";
        }
        await fetchRemote();
        return "ok";
      }

      const createdAt = Date.now();
      const report: Report = {
        ...input,
        id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt,
        source: "user",
      };
      const next = [...localReports, report];
      saveUserReports(next);
      setLocalReports(next);
      setNow(createdAt);
      return "ok";
    },
    [fetchRemote, localReports],
  );

  const ready = now !== null && (!isSupabaseConfigured || remoteLoaded);

  return { ready, now: now ?? 0, reports, addReport, syncError };
}
