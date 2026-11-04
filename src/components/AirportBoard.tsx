"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { AIRPORTS } from "@/data/airports";
import { searchAirports } from "@/lib/search";
import { summarize, VALID_WINDOW_MS } from "@/lib/stats";
import type { Summary } from "@/lib/stats";
import { DIRECTIONS, DIRECTION_LABEL } from "@/lib/types";
import type { Direction } from "@/lib/types";
import { useAirportActivity } from "@/lib/useAirportUpdates";
import { useReports } from "@/lib/useReports";
import AirportActivity from "./AirportActivity";
import AirportName from "./AirportName";
import AirportGlobeSlot from "./AirportGlobeSlot";
import CountryFlag from "./CountryFlag";
import type { GlobeStatuses } from "./AirportGlobe";
import DataNotice from "./DataNotice";
import { EASE, SPRING } from "./motion";
import { PACE, paceOf } from "./pace";
import { airportRegion, REGION_FILTERS, regionLabel } from "./regions";
import type { RegionId } from "./regions";
import SlidingChoice from "./SlidingChoice";

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
      {loading || !pace ? (
        <span className="skeleton h-2.5 w-2.5 shrink-0 rounded-full" aria-hidden="true" />
      ) : (
        <m.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${PACE[pace].dot}`}
          aria-hidden="true"
        />
      )}
      <span className="text-slate-600">{DIRECTION_LABEL[direction]}</span>
      <span className="ml-auto text-right">
        {loading || !pace ? (
          <span className="skeleton inline-block h-3.5 w-16 rounded-full align-middle" />
        ) : minutes === null ? (
          <span className="font-medium text-slate-500">暂无数据</span>
        ) : (
          <m.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="font-medium"
          >
            <span className="tabular-nums text-ink">{minutes} 分钟</span>
            <span className={`ml-2 text-xs font-semibold ${PACE[pace].text}`}>{PACE[pace].label}</span>
          </m.span>
        )}
      </span>
    </div>
  );
}

export default function AirportBoard() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const { ready, now, reports } = useReports();
  const activity = useAirportActivity();

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

  const globeStatuses = useMemo(() => {
    const out: GlobeStatuses = {};
    for (const airport of AIRPORTS) {
      out[airport.code] = {
        departure: summaries.get(`${airport.code}:departure`)?.medianMinutes ?? null,
        arrival: summaries.get(`${airport.code}:arrival`)?.medianMinutes ?? null,
      };
    }
    return out;
  }, [summaries]);

  const filtered = query.trim() !== "" || region !== "all";

  return (
    <div>
      <section className="relative bg-board text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-sign" />
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sign/15 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-5xl gap-6 px-4 pb-20 pt-8 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,460px)] lg:items-center lg:pt-14">
          <div>
            <p className="rise-in text-sm font-semibold tracking-[0.18em] text-sign" style={{ animationDelay: "40ms" }}>
              机场边检排队
            </p>
            <h1
              className="rise-in mt-3 font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "80ms" }}
            >
              BorderTime
            </h1>
            <p
              className="rise-in mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg"
              style={{ animationDelay: "130ms" }}
            >
              旅客自己记录、自己分享的机场边检排队时间。
            </p>
            <p
              className="rise-in mt-5 inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm ring-1 ring-white/15"
              style={{ animationDelay: "180ms" }}
              role="status"
            >
              <span className="h-2 w-2 rounded-full bg-sign" aria-hidden="true" />
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={ready ? "count" : "loading"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {ready ? `近 ${windowHours} 小时共 ${recentCount} 条报告` : "正在读取报告…"}
                </m.span>
              </AnimatePresence>
            </p>
            <div className="rise-in mt-6 max-w-2xl" style={{ animationDelay: "230ms" }}>
              <label htmlFor="airport-search" className="mb-2 block text-sm font-medium text-slate-200">
                搜索机场
              </label>
              <input
                id="airport-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入 CAN、PVG、LHR，或城市名"
                autoComplete="off"
                className="min-h-14 w-full rounded-2xl border-0 bg-white px-5 text-base text-ink shadow-lift transition-shadow duration-200 placeholder:text-slate-400 focus-visible:shadow-lift"
              />
            </div>
          </div>
          <div className="rise-in" style={{ animationDelay: "160ms" }}>
            <div className="relative mx-auto h-[230px] w-full max-w-[440px] sm:h-[300px] lg:mx-0 lg:h-[420px] lg:max-w-none">
              <div className="pointer-events-none absolute inset-x-[18%] bottom-[6%] h-8 rounded-[100%] bg-black/30 blur-xl" />
              <AirportGlobeSlot ready={ready} statuses={globeStatuses} />
            </div>
            <p className="mt-1 text-center text-xs leading-relaxed text-slate-300 lg:text-left">
              拖动旋转。点一个机场，飞机沿航线飞往其他机场，再点空白处可取消。
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 pb-16">
        <div className="rise-in" style={{ animationDelay: "80ms" }}>
          <DataNotice />
        </div>

        <SlidingChoice
          className="mt-5"
          ariaLabel="按地区筛选"
          mode="chips"
          items={REGION_FILTERS}
          value={region}
          onChange={setRegion}
        />

        <p className="mt-4 text-sm text-slate-600" role="status">
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={filtered ? `found-${results.length}` : "all"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
              className="inline-block"
            >
              {filtered ? `找到 ${results.length} 个机场` : `共 ${AIRPORTS.length} 个机场`}
            </m.span>
          </AnimatePresence>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          绿点较快（15 分钟及以内），黄点中等，红点较慢，灰点为暂无数据。
        </p>

        <m.ul layout className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial>
            {results.length === 0 ? (
              <m.li
                key="empty"
                className="md:col-span-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <p className="rounded-3xl border border-dashed border-line bg-white px-6 py-10 text-center leading-relaxed text-slate-700">
                  没有找到匹配的机场。试试三字码（如 BCN），或者中文、英文城市名。
                </p>
              </m.li>
            ) : (
              results.map((airport, index) => {
                const area = regionLabel(airport);
                return (
                  <m.li
                    key={airport.code}
                    layout
                    className="card-motion h-full"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16, delay: 0 } }}
                    transition={{
                      layout: SPRING,
                      opacity: { duration: 0.32, delay: Math.min(index, 8) * 0.04, ease: EASE },
                      y: { duration: 0.36, delay: Math.min(index, 8) * 0.04, ease: EASE },
                    }}
                  >
                    <Link
                      href={`/airports/${airport.code}`}
                      className="press-card group flex h-full flex-col rounded-3xl bg-white p-5 ring-1 ring-black/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-display text-5xl font-bold leading-none tracking-wide transition-colors duration-200 group-hover:text-board">
                          {airport.code}
                        </span>
                        {area && (
                          <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-slate-600">
                            {area}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 min-w-0 font-medium leading-snug">
                        <AirportName airport={airport} />
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center text-sm text-slate-500">
                        <span className="min-w-0 truncate">{airport.name}</span>
                        <CountryFlag code={airport.countryCode} label={airport.countryZh} decorative />
                        <span className="shrink-0"> · {airport.countryZh}</span>
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
                        <AirportActivity count={activity[airport.code] ?? 0} />
                      </div>
                    </Link>
                  </m.li>
                );
              })
            )}
          </AnimatePresence>
        </m.ul>
      </div>
    </div>
  );
}
