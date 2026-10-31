"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AIRPORTS } from "@/data/airports";
import { searchAirports } from "@/lib/search";
import { summarize, VALID_WINDOW_MS } from "@/lib/stats";
import type { Summary } from "@/lib/stats";
import { DIRECTIONS, DIRECTION_LABEL } from "@/lib/types";
import type { Direction } from "@/lib/types";
import { useReports } from "@/lib/useReports";
import DataNotice from "./DataNotice";
import { airportRegion, REGION_FILTERS, regionLabel } from "./regions";
import type { RegionId } from "./regions";

/** 状态点只反映已算出的中位数落在哪一档，不改变估算本身。 */
type Pace = "fast" | "mid" | "slow" | "none";

const PACE: Record<Pace, { dot: string; text: string; label: string }> = {
  fast: { dot: "bg-[#1C8C4E]", text: "text-ok", label: "较快" },
  mid: { dot: "bg-[#F0B400]", text: "text-warn", label: "中等" },
  slow: { dot: "bg-[#D23B2F]", text: "text-bad", label: "较慢" },
  none: { dot: "bg-slate-300", text: "text-slate-500", label: "暂无数据" },
};

function paceOf(minutes: number | null): Pace {
  if (minutes === null) return "none";
  if (minutes <= 15) return "fast";
  if (minutes <= 35) return "mid";
  return "slow";
}

function StatusLine({
  direction,
  summary,
  loading,
}: {
  direction: Direction;
  summary: Summary | undefined;
  loading: boolean;
}) {
  const minutes = summary ? summary.medianMinutes : null;
  const pace = loading ? null : paceOf(minutes);

  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${pace ? PACE[pace].dot : "bg-slate-300"}`}
        aria-hidden="true"
      />
      <span className="text-slate-600">{DIRECTION_LABEL[direction]}</span>
      <span className="ml-auto text-right">
        {loading || !pace ? (
          <span className="text-slate-400">…</span>
        ) : minutes === null ? (
          <span className="font-medium text-slate-500">暂无数据</span>
        ) : (
          <span className="font-medium">
            <span className="tabular-nums text-ink">{minutes} 分钟</span>
            <span className={`ml-2 text-xs font-semibold ${PACE[pace].text}`}>
              {PACE[pace].label}
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

export default function AirportBoard() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const { ready, now, reports } = useReports();

  const windowHours = VALID_WINDOW_MS / 3_600_000;

  const recentCount = useMemo(
    () => reports.filter((r) => now - r.createdAt <= VALID_WINDOW_MS).length,
    [reports, now],
  );

  const scoped = useMemo(() => {
    if (region === "all") return AIRPORTS;
    return AIRPORTS.filter((airport) => airportRegion(airport) === region);
  }, [region]);

  const results = useMemo(() => searchAirports(scoped, query), [scoped, query]);

  const summaries = useMemo(() => {
    const map = new Map<string, Summary>();
    for (const airport of AIRPORTS) {
      for (const direction of DIRECTIONS) {
        const subset = reports.filter(
          (r) => r.airportCode === airport.code && r.direction === direction,
        );
        map.set(`${airport.code}:${direction}`, summarize(subset, now));
      }
    }
    return map;
  }, [reports, now]);

  const filtered = query.trim() !== "" || region !== "all";

  return (
    <div>
      <section className="relative overflow-hidden bg-board text-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-sign" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sign/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 motion-safe:animate-rise sm:pb-20 sm:pt-14">
          <p className="text-sm font-semibold tracking-[0.18em] text-sign">机场边检排队</p>
          <h1 className="mt-3 font-display text-6xl font-bold leading-none tracking-tight sm:text-8xl">
            BorderTime
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
            旅客自己记录、自己分享的机场边检排队时间。
          </p>
          <p
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm ring-1 ring-white/15"
            role="status"
          >
            <span className="h-2 w-2 rounded-full bg-sign" aria-hidden="true" />
            {ready ? `近 ${windowHours} 小时共 ${recentCount} 条报告` : "正在读取报告…"}
          </p>
          <div className="mt-6 max-w-2xl">
            <label htmlFor="airport-search" className="mb-2 block text-sm font-medium text-slate-200">
              搜索机场
            </label>
            <input
              id="airport-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入 BCN、MAD、LHR，或城市名"
              autoComplete="off"
              className="min-h-14 w-full rounded-2xl border-0 bg-white px-5 text-base text-ink shadow-lift placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 pb-16">
        <div className="motion-safe:animate-rise">
          <DataNotice />
        </div>

        <div
          role="group"
          aria-label="按地区筛选"
          className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REGION_FILTERS.map((item) => {
            const selected = item.id === region;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setRegion(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? "bg-board text-white shadow-sm"
                    : "bg-white text-ink ring-1 ring-line hover:ring-board"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-slate-600" role="status">
          {filtered ? `找到 ${results.length} 个机场` : `共 ${AIRPORTS.length} 个机场`}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          绿点较快（15 分钟及以内），黄点中等，红点较慢，灰点为暂无数据。
        </p>

        {results.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-line bg-white px-6 py-10 text-center leading-relaxed text-slate-700">
            没有找到匹配的机场。试试三字码（如 BCN），或者中文、英文城市名。
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((airport, index) => {
              const area = regionLabel(airport);
              return (
                <li
                  key={airport.code}
                  className="h-full motion-safe:animate-rise"
                  style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                >
                  <Link
                    href={`/airports/${airport.code}`}
                    className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/[0.04] transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-display text-5xl font-bold leading-none tracking-wide">
                        {airport.code}
                      </span>
                      {area && (
                        <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-slate-600">
                          {area}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 font-medium leading-snug">{airport.nameZh}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {airport.name} · {airport.countryZh}
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="space-y-2.5 rounded-2xl bg-mist px-3.5 py-3">
                        {DIRECTIONS.map((direction) => (
                          <StatusLine
                            key={direction}
                            direction={direction}
                            summary={summaries.get(`${airport.code}:${direction}`)}
                            loading={!ready}
                          />
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
