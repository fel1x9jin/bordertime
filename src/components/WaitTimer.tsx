"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { clearTimer, loadTimer, saveTimer } from "@/lib/storage";
import { formatDuration } from "@/lib/format";
import { DIRECTION_LABEL } from "@/lib/types";
import type { ActiveTimer, Airport, Crowd, Direction } from "@/lib/types";
import type { SubmitResult } from "@/lib/useReports";
import { primaryButtonClass, secondaryButtonClass } from "./buttons";
import CrowdPicker from "./CrowdPicker";
import { EASE } from "./motion";

/** 超过 6 小时的计时视为忘记结束，不允许提交 */
const MAX_TIMER_MS = 6 * 60 * 60 * 1000;

export interface TimerResult {
  waitMinutes: number; // 排队到通过的总耗时
  queueMinutes: number | null; // 排队到窗口前（可选）
  processingMinutes: number | null; // 窗口办理（可选）
  crowd: Crowd | null;
}

interface Props {
  airport: Airport;
  direction: Direction;
  onSubmit: (result: TimerResult) => Promise<SubmitResult>;
}

const primaryButton = primaryButtonClass;
const secondaryButton = secondaryButtonClass;

const toMinutes = (ms: number) => Math.round(ms / 60000);

const phaseMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: EASE },
};

export default function WaitTimer({ airport, direction, onSubmit }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [now, setNow] = useState(0);
  const [crowd, setCrowd] = useState<Crowd | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<"rate_limited" | "error" | null>(null);

  // 计时状态保存在浏览器里，刷新页面不会丢
  useEffect(() => {
    setTimer(loadTimer());
    setNow(Date.now());
    setLoaded(true);
  }, []);

  const running = timer !== null && timer.endedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // 成功提示 6 秒后自动消失
  useEffect(() => {
    if (!submitted) return;
    const id = setTimeout(() => setSubmitted(false), 6000);
    return () => clearTimeout(id);
  }, [submitted]);

  const isMine =
    timer !== null &&
    timer.airportCode === airport.code &&
    timer.direction === direction;

  function update(next: ActiveTimer) {
    saveTimer(next);
    setTimer(next);
  }

  function start() {
    const t: ActiveTimer = {
      airportCode: airport.code,
      direction,
      startedAt: Date.now(),
      reachedDeskAt: null,
      endedAt: null,
    };
    update(t);
    setNow(t.startedAt);
    setSubmitted(false);
    setFailure(null);
  }

  function reachDesk() {
    if (!timer || timer.reachedDeskAt !== null) return;
    update({ ...timer, reachedDeskAt: Date.now() });
  }

  function stop() {
    if (!timer) return;
    update({ ...timer, endedAt: Date.now() });
  }

  function discard() {
    clearTimer();
    setTimer(null);
    setCrowd(null);
    setFailure(null);
  }

  async function submit() {
    if (!timer || timer.endedAt === null || submitting) return;
    const startedAt = timer.startedAt;
    const endedAt = timer.endedAt;
    const reachedDeskAt = timer.reachedDeskAt;

    setSubmitting(true);
    setFailure(null);
    const result = await onSubmit({
      waitMinutes: Math.max(1, toMinutes(endedAt - startedAt)),
      queueMinutes:
        reachedDeskAt !== null ? toMinutes(reachedDeskAt - startedAt) : null,
      processingMinutes:
        reachedDeskAt !== null ? toMinutes(endedAt - reachedDeskAt) : null,
      crowd,
    });
    setSubmitting(false);

    if (result !== "ok") {
      setFailure(result === "rate_limited" ? "rate_limited" : "error"); // 计时结果还在，用户可以再试一次
      return;
    }
    clearTimer();
    setTimer(null);
    setCrowd(null);
    setSubmitted(true);
  }

  const atDesk = timer !== null && timer.reachedDeskAt !== null;
  const phase = !loaded
    ? "loading"
    : timer && !isMine
      ? "foreign"
      : timer && running
        ? "running"
        : timer && timer.endedAt !== null
          ? "ended"
          : "idle";

  let body = null;

  if (phase === "loading") {
    body = <div className="skeleton h-28 w-full rounded-2xl" aria-hidden="true" />;
  } else if (phase === "foreign" && timer) {
    body = (
      <div className="space-y-3">
        <p className="leading-relaxed">
          你有一个未完成的计时：{timer.airportCode}{" "}
          {DIRECTION_LABEL[timer.direction]}。同一时间只能记录一次排队。
        </p>
        <button type="button" onClick={discard} className={secondaryButton}>
          放弃那个计时
        </button>
      </div>
    );
  } else if (phase === "running" && timer) {
    body = (
      <div className="space-y-4">
        <div
          className={`rounded-2xl bg-board px-5 py-5 text-sign shadow-card transition-shadow duration-300 ${
            atDesk ? "shadow-[inset_0_0_0_2px_rgba(255,199,44,0.85)]" : ""
          }`}
          role="timer"
          aria-live="off"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.p
              key={atDesk ? "desk" : "queue"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <span className="live-dot" aria-hidden="true" />
              {atDesk ? "已到窗口，正在办理" : "已排队"}
            </m.p>
          </AnimatePresence>
          <p className="mt-1 font-display text-6xl font-bold leading-none tabular-nums">
            {formatDuration(now - timer.startedAt)}
          </p>
          <AnimatePresence initial={false}>
            {atDesk && timer.reachedDeskAt !== null && (
              <m.p
                key="split"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="mt-2 text-sm text-slate-300"
              >
                排队用了 {formatDuration(timer.reachedDeskAt - timer.startedAt)}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <AnimatePresence initial={false}>
            {!atDesk && (
              <m.div
                key="desk-btn"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <button type="button" onClick={reachDesk} className={secondaryButton}>
                  我到窗口了（可选）
                </button>
              </m.div>
            )}
          </AnimatePresence>
          <button type="button" onClick={stop} className={primaryButton}>
            我已通过边检，结束计时
          </button>
          <button type="button" onClick={discard} className={secondaryButton}>
            取消计时
          </button>
        </div>
      </div>
    );
  } else if (phase === "ended" && timer && timer.endedAt !== null) {
    const elapsed = timer.endedAt - timer.startedAt;
    const tooLong = elapsed > MAX_TIMER_MS;
    const minutes = Math.max(1, toMinutes(elapsed));
    const split =
      timer.reachedDeskAt !== null
        ? {
            queue: toMinutes(timer.reachedDeskAt - timer.startedAt),
            processing: toMinutes(timer.endedAt - timer.reachedDeskAt),
          }
        : null;

    body = (
      <div className="space-y-4">
        <div className="rounded-2xl bg-board px-5 py-5 text-sign shadow-card">
          <p className="text-sm text-slate-300">本次总耗时</p>
          <p className="font-display text-6xl font-bold leading-none tabular-nums">
            {formatDuration(elapsed)}
          </p>
          {split && (
            <p className="mt-2 text-sm text-slate-300">
              排队 {split.queue} 分钟，窗口办理 {split.processing} 分钟
            </p>
          )}
        </div>
        {tooLong ? (
          <p className="leading-relaxed text-bad">
            这次计时超过 6 小时，可能忘记结束了，不能提交。请放弃后重新计时。
          </p>
        ) : (
          <>
            <p className="leading-relaxed">
              提交后会记录为 {minutes} 分钟。想补充的话，可以选一下当时的拥挤程度（可不选）。
            </p>
            <CrowdPicker value={crowd} onChange={setCrowd} />
          </>
        )}
        {failure === "rate_limited" && (
          <p role="alert" className="leading-relaxed text-bad">
            提交太频繁了：同一个网络 10 分钟内最多提交 6 条。你的计时结果还在，请稍后再点一次「提交报告」。
          </p>
        )}
        {failure === "error" && (
          <p role="alert" className="leading-relaxed text-bad">
            提交失败，网络或服务器暂时有问题。你的计时结果还在，稍后可以再点一次「提交报告」。
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          {!tooLong && (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={primaryButton}
            >
              {submitting ? "提交中…" : "提交报告"}
            </button>
          )}
          <button
            type="button"
            onClick={discard}
            disabled={submitting}
            className={secondaryButton}
          >
            放弃这次记录
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="space-y-3">
        <p className="leading-relaxed text-slate-700">
          排到队尾时点「开始计时」，通过边检后点「结束计时」。如果你愿意，走到窗口前再点一下
          「我到窗口了」，我们就能把排队和窗口办理分开记录。
        </p>
        <button type="button" onClick={start} className={primaryButton}>
          开始计时（{DIRECTION_LABEL[direction]}）
        </button>
        <AnimatePresence initial={false}>
          {submitted && (
            <m.p
              key="thanks"
              role="status"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="pop-in text-sm text-ok"
            >
              已提交，谢谢你的报告。
            </m.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={phase} {...phaseMotion}>
        {body}
      </m.div>
    </AnimatePresence>
  );
}
