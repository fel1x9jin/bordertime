"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { formatAgo } from "@/lib/format";
import { summarize, VALID_WINDOW_MS } from "@/lib/stats";
import { CROWD_LABEL, CROWD_STYLE, DIRECTIONS, DIRECTION_LABEL } from "@/lib/types";
import type { Airport, Direction } from "@/lib/types";
import { useReports } from "@/lib/useReports";
import AirportName from "./AirportName";
import CrowdForm from "./CrowdForm";
import DataNotice from "./DataNotice";
import LiveUpdates from "./LiveUpdates";
import { EASE } from "./motion";
import ReportList from "./ReportList";
import SlidingChoice from "./SlidingChoice";
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
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:pb-14 sm:pt-10">
          <Link
            href="/"
            className="press inline-flex min-h-10 items-center rounded-full bg-white/10 px-3.5 text-sm ring-1 ring-white/15 hover:bg-white/15"
          >
            ← 返回机场列表
          </Link>
          <h1 className="rise-in mt-6 font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl">
            {airport.code}
          </h1>
          <p className="mt-3 text-xl font-medium leading-snug text-sign">
            <AirportName airport={airport} />
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            <AirportName airport={airport} field="name" decorative />
            <span> · {airport.cityZh} · {airport.countryZh}</span>
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

        <SlidingChoice
          ariaLabel="边检方向"
          mode="tabs"
          items={DIRECTIONS.map((id) => ({ id, label: DIRECTION_LABEL[id] }))}
          value={direction}
          onChange={setDirection}
        />

        <section
          aria-label={`${DIRECTION_LABEL[direction]}预计等待时间`}
          className="relative overflow-hidden rounded-3xl bg-board p-6 text-white shadow-lift sm:p-8"
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-sign" aria-hidden="true" />
          <p className="text-sm text-slate-300">
            预计排队等待时间（近 {windowHours} 小时报告的中位数）
          </p>
          <div className="mt-3">
            <WaitReadout minutes={summary.medianMinutes} loading={!ready} size="lg" />
          </div>
          <m.dl
            key={direction}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"
          >
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
          </m.dl>
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
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={direction}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <WaitTimer
                airport={airport}
                direction={direction}
                onSubmit={(result) =>
                  addReport({ airportCode: airport.code, direction, ...result })
                }
              />
            </m.div>
          </AnimatePresence>
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

        <LiveUpdates airportCode={airport.code} airportName={airport.nameZh} />
      </div>
    </div>
  );
}
