"use client";

import { AnimatePresence, m } from "motion/react";
import { formatAgo } from "@/lib/format";
import { VALID_WINDOW_MS } from "@/lib/stats";
import { CROWD_LABEL, CROWD_STYLE } from "@/lib/types";
import type { Report, ReportSource } from "@/lib/types";
import { EASE } from "./motion";

interface Props {
  reports: Report[]; // 已按时间从新到旧排序
  now: number;
  ready: boolean;
}

const MAX_SHOWN = 10;

const SOURCE_LABEL: Record<ReportSource, string> = {
  mock: "模拟示例",
  user: "我的报告",
  remote: "旅客报告",
};

const SOURCE_STYLE: Record<ReportSource, string> = {
  mock: "bg-slate-200 text-slate-700",
  user: "bg-sign text-ink",
  remote: "bg-board/10 text-board",
};

export default function ReportList({ reports, now, ready }: Props) {
  if (!ready) {
    return (
      <ul className="grid gap-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <li key={item} className="rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-3">
              <span className="skeleton h-5 w-16 rounded-full" />
              <span className="skeleton h-4 w-28 rounded-full" />
              <span className="skeleton ml-auto h-4 w-14 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (reports.length === 0) {
    return (
      <m.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="rounded-2xl bg-white px-4 py-5 leading-relaxed text-slate-700 shadow-card ring-1 ring-black/[0.04]"
      >
        这个方向还没有报告。你可以成为第一个：通过边检时用上面的计时器记录一次。
      </m.p>
    );
  }

  const shown = reports.slice(0, MAX_SHOWN);

  return (
    <ul className="grid gap-3">
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((r, index) => {
          const expired = now - r.createdAt > VALID_WINDOW_MS;
          return (
            <m.li
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: expired ? 0.6 : 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.14, delay: 0 } }}
              transition={{ duration: 0.26, delay: Math.min(index, 5) * 0.04, ease: EASE }}
              className="rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-black/[0.04]"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SOURCE_STYLE[r.source]}`}>
                  {SOURCE_LABEL[r.source]}
                </span>
                <span className="font-medium">
                  {r.waitMinutes !== null ? `排队 ${r.waitMinutes} 分钟` : "只提交了拥挤程度"}
                </span>
                {r.queueMinutes !== null && r.processingMinutes !== null && (
                  <span className="text-sm text-slate-700">
                    （排队 {r.queueMinutes} 分，窗口办理 {r.processingMinutes} 分）
                  </span>
                )}
                {r.crowd && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CROWD_STYLE[r.crowd]}`}>
                    {CROWD_LABEL[r.crowd]}
                  </span>
                )}
                <span className="ml-auto text-sm text-slate-500">{formatAgo(now, r.createdAt)}</span>
              </div>
              {expired && <p className="mt-2 text-xs text-slate-500">已超过 3 小时，不计入估算</p>}
            </m.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
