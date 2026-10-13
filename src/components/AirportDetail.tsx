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
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm underline underline-offset-4">
        返回机场列表
      </Link>

      <header>
        <h1 className="font-display text-6xl font-bold leading-none">
          {airport.code}
        </h1>
        <p className="mt-2 text-lg font-medium">{airport.nameZh}</p>
        <p className="text-sm text-slate-600">
          {airport.name}，{airport.cityZh}，{airport.countryZh}
        </p>
      </header>

      <DataNotice />

      {syncError && (
        <p
          role="alert"
          className="border-l-4 border-bad bg-white px-4 py-3 text-sm leading-relaxed"
        >
          {syncError}
        </p>
      )}

      <div
        role="tablist"
        aria-label="边检方向"
        className="grid grid-cols-2 border border-line bg-white"
      >
        {DIRECTIONS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === direction}
            onClick={() => setDirection(d)}
            className={`min-h-12 px-4 py-3 font-medium ${
              d === direction ? "bg-board text-white" : "hover:bg-mist"
            }`}
          >
            {DIRECTION_LABEL[d]}
          </button>
        ))}
      </div>

      <section
        aria-label={`${DIRECTION_LABEL[direction]}预计等待时间`}
        className="bg-board p-5 text-white"
      >
        <p className="text-sm text-slate-300">
          预计排队等待时间（近 {windowHours} 小时报告的中位数）
        </p>
        <div className="mt-2">
          <WaitReadout minutes={summary.medianMinutes} loading={!ready} size="lg" />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-slate-300">有效报告</dt>
            <dd className="mt-1 text-base font-medium">
              {ready ? `${summary.validCount} 条` : "…"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-300">最近更新</dt>
            <dd className="mt-1 text-base font-medium">
              {!ready
                ? "…"
                : summary.lastUpdated
                  ? formatAgo(now, summary.lastUpdated)
                  : "暂无"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-300">拥挤程度</dt>
            <dd className="mt-1">
              {ready && summary.latestCrowd ? (
                <span className="inline-block bg-white">
                  <span
                    className={`inline-block px-2 py-0.5 text-sm font-medium ${CROWD_STYLE[summary.latestCrowd]}`}
                  >
                    {CROWD_LABEL[summary.latestCrowd]}
                  </span>
                </span>
              ) : (
                <span className="text-base font-medium">{ready ? "暂无" : "…"}</span>
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

      <section className="border border-line bg-white p-5">
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

      <section className="border border-line bg-white p-5">
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
  );
}
