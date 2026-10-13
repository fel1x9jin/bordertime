import { formatAgo } from "@/lib/format";
import { VALID_WINDOW_MS } from "@/lib/stats";
import { CROWD_LABEL, CROWD_STYLE } from "@/lib/types";
import type { Report, ReportSource } from "@/lib/types";

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
    return <p className="text-slate-600">加载中…</p>;
  }

  if (reports.length === 0) {
    return (
      <p className="leading-relaxed text-slate-700">
        这个方向还没有报告。你可以成为第一个：通过边检时用上面的计时器记录一次。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line bg-white">
      {reports.slice(0, MAX_SHOWN).map((r) => {
        const expired = now - r.createdAt > VALID_WINDOW_MS;
        return (
          <li
            key={r.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-3 ${
              expired ? "opacity-60" : ""
            }`}
          >
            <span
              className={`px-2 py-0.5 text-xs font-medium ${SOURCE_STYLE[r.source]}`}
            >
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
              <span className={`px-2 py-0.5 text-xs font-medium ${CROWD_STYLE[r.crowd]}`}>
                {CROWD_LABEL[r.crowd]}
              </span>
            )}
            <span className="ml-auto text-sm text-slate-600">
              {formatAgo(now, r.createdAt)}
            </span>
            {expired && (
              <span className="basis-full text-xs text-slate-600">
                已超过 3 小时，不计入估算
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
