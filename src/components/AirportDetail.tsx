"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatAgo } from "@/lib/format";
import { summarize, VALID_WINDOW_MS } from "@/lib/stats";
import { CROWD_LABEL, CROWD_STYLE, DIRECTIONS, DIRECTION_LABEL } from "@/lib/types";
import type { Airport, Direction } from "@/lib/types";
import { useReports } from "@/lib/useReports";
import CrowdForm from "./CrowdForm";
import DataNotice from "./DataNotice";
import ReportList from "./ReportList";
import WaitReadout from "./WaitReadout";
import WaitTimer from "./WaitTimer";

export default function AirportDetail({ airport }: { airport: Airport }) {
  const [direction, setDirection] = useState<Direction>("departure");
  const { ready, now, reports, addReport, syncError } = useReports();

  const directionReports = useMemo(
    () =>
      reports
        .filter((r) => r.airportCode === airport.code && r.direction === direction)
        .sort((a, b) => b.createdAt - a.createdAt),
    [reports, airport.code, direction],
  );

  const summary = useMemo(
    () => summarize(directionReports, now),
    [directionReports, now],
  );

  const windowHours = VALID_WINDOW_MS / 3_600_000;

  return (
    <div>
      <header className="relative overflow-hidden bg-board text-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-sign" aria-hidden="true" />
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 motion-safe:animate-rise sm:pb-14 sm:pt-10">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-full bg-white/10 px-3.5 text-sm ring-1 ring-white/15 transition hover:bg-white/15"
          >
            ← 返回机场列表
          </Link>
          <h1 className="mt-6 font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl">
            {airport.code}
          </h1>
          <p className="mt-3 text-xl font-medium text-sign">{airport.nameZh}</p>
          <p className="mt-1 text-sm text-slate-300">
            {airport.name} · {airport.cityZh} · {airport.countryZh}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 pb-16 pt-6 sm:pt-8">
        <DataNotice />

        {syncError && (
          <p
            role="alert"
            className="rounded-2xl border border-bad/20 bg-white px-4 py-3 text-sm leading-relaxed text-bad shadow-card"
          >
            {syncError}
          </p>
        )}

        <div
          role="tablist"
          aria-label="边检方向"
          className="flex rounded-full bg-white p-1 shadow-card ring-1 ring-black/[0.04]"
        >
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === direction}
              onClick={() => setDirection(d)}
              className={`min-h-12 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:text-base ${
                d === direction ? "bg-board text-white shadow-sm" : "text-ink hover:bg-mist"
              }`}
            >
              {DIRECTION_LABEL[d]}
            </button>
          ))}
        </div>

        <section
          aria-label={`${DIRECTION_LABEL[direction]}预计等待时间`}
          className="relative overflow-hidden rounded-3xl bg-board p-6 text-white shadow-lift motion-safe:animate-rise sm:p-8"
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-sign" aria-hidden="true" />
          <p className="text-sm text-slate-300">
            预计排队等待时间（近 {windowHours} 小时报告的中位数）
          </p>
          <div className="mt-3">
            <WaitReadout minutes={summary.medianMinutes} loading={!ready} size="lg" />
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <dt className="text-xs text-slate-300 sm:text-sm">有效报告</dt>
              <dd className="mt-1 text-sm font-semibold sm:text-base">
                {ready ? `${summary.validCount} 条` : "…"}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <dt className="text-xs text-slate-300 sm:text-sm">最近更新</dt>
              <dd className="mt-1 text-sm font-semibold sm:text-base">
                {!ready
                  ? "…"
                  : summary.lastUpdated
                    ? formatAgo(now, summary.lastUpdated)
                    : "暂无"}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <dt className="text-xs text-slate-300 sm:text-sm">拥挤程度</dt>
              <dd className="mt-1">
                {ready && summary.latestCrowd ? (
                  <span className="inline-block rounded-full bg-white">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-sm font-medium ${CROWD_STYLE[summary.latestCrowd]}`}
                    >
                      {CROWD_LABEL[summary.latestCrowd]}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold sm:text-base">{ready ? "暂无" : "…"}</span>
                )}
              </dd>
            </div>
          </dl>
          {ready && summary.validCount > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              其中 {summary.timedCount} 条带计时
              {summary.mockCount > 0 ? `，${summary.mockCount} 条为模拟示例` : ""}。
              这些是旅客自己报告的排队耗时，不是官方数据。
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/[0.04] sm:p-6">
          <h2 className="mb-3 text-xl font-semibold">记录你的排队时间</h2>
          {/* key 保证切换出境/入境时，计时器的界面状态跟着方向重置 */}
          <WaitTimer
            key={direction}
            airport={airport}
            direction={direction}
            onSubmit={(result) =>
              addReport({ airportCode: airport.code, direction, ...result })
            }
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/[0.04] sm:p-6">
          <h2 className="mb-1 text-xl font-semibold">只想说说现在有多挤</h2>
          <p className="mb-3 text-sm text-slate-700">
            不想计时也可以，选一个最接近的程度提交。
          </p>
          <CrowdForm
            key={direction}
            onSubmit={(crowd) =>
              addReport({
                airportCode: airport.code,
                direction,
                waitMinutes: null,
                queueMinutes: null,
                processingMinutes: null,
                crowd,
              })
            }
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            最近的{DIRECTION_LABEL[direction]}报告
          </h2>
          <ReportList reports={directionReports} now={now} ready={ready} />
        </section>
      </div>
    </div>
  );
}
