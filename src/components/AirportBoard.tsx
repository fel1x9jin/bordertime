"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AIRPORTS } from "@/data/airports";
import { searchAirports } from "@/lib/search";
import { summarize } from "@/lib/stats";
import type { Summary } from "@/lib/stats";
import { DIRECTIONS, DIRECTION_LABEL } from "@/lib/types";
import { useReports } from "@/lib/useReports";
import WaitReadout from "./WaitReadout";

export default function AirportBoard() {
  const [query, setQuery] = useState("");
  const { ready, now, reports } = useReports();

  const results = useMemo(() => searchAirports(AIRPORTS, query), [query]);

  // 每个机场、每个方向的统计
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

  return (
    <section aria-label="机场列表">
      <label htmlFor="airport-search" className="mb-2 block font-medium">
        搜索机场
      </label>
      <input
        id="airport-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入 BCN、MAD、LHR，或城市名"
        autoComplete="off"
        className="min-h-12 w-full border border-line bg-white px-4 text-base placeholder:text-slate-500"
      />

      <p className="mt-3 text-sm text-slate-600" role="status">
        {query.trim() ? `找到 ${results.length} 个机场` : `共 ${AIRPORTS.length} 个机场`}
      </p>

      {results.length === 0 ? (
        <p className="mt-6 leading-relaxed text-slate-700">
          没有找到匹配的机场。试试三字码（如 BCN），或者中文、英文城市名。
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {results.map((airport) => (
            <li key={airport.code}>
              <Link
                href={`/airports/${airport.code}`}
                className="block px-1 py-4 hover:bg-white"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-4xl font-bold leading-none">
                    {airport.code}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{airport.nameZh}</p>
                    <p className="truncate text-sm text-slate-600">
                      {airport.name}，{airport.countryZh}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {DIRECTIONS.map((direction) => {
                    const s = summaries.get(`${airport.code}:${direction}`);
                    return (
                      <div key={direction} className="bg-board px-3 py-2">
                        <p className="text-xs text-slate-300">
                          {DIRECTION_LABEL[direction]}
                        </p>
                        <WaitReadout
                          minutes={s ? s.medianMinutes : null}
                          loading={!ready}
                        />
                        <p className="text-xs text-slate-400">
                          {ready && s ? `${s.validCount} 条有效报告` : "\u00A0"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
