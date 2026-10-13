"use client";

import { useEffect, useState } from "react";
import { clearTimer, loadTimer, saveTimer } from "@/lib/storage";
import { formatDuration } from "@/lib/format";
import { DIRECTION_LABEL } from "@/lib/types";
import type { ActiveTimer, Airport, Crowd, Direction } from "@/lib/types";
import CrowdPicker from "./CrowdPicker";

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
  onSubmit: (result: TimerResult) => Promise<boolean>;
}

const primaryButton =
  "min-h-12 w-full bg-board px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";
const secondaryButton =
  "min-h-12 w-full border border-line bg-white px-4 py-3 font-medium sm:w-auto";

const toMinutes = (ms: number) => Math.round(ms / 60000);

export default function WaitTimer({ airport, direction, onSubmit }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [now, setNow] = useState(0);
  const [crowd, setCrowd] = useState<Crowd | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

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
    setFailed(false);
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
    setFailed(false);
  }

  async function submit() {
    if (!timer || timer.endedAt === null || submitting) return;
    const startedAt = timer.startedAt;
    const endedAt = timer.endedAt;
    const reachedDeskAt = timer.reachedDeskAt;

    setSubmitting(true);
    setFailed(false);
    const ok = await onSubmit({
      waitMinutes: Math.max(1, toMinutes(endedAt - startedAt)),
      queueMinutes:
        reachedDeskAt !== null ? toMinutes(reachedDeskAt - startedAt) : null,
      processingMinutes:
        reachedDeskAt !== null ? toMinutes(endedAt - reachedDeskAt) : null,
      crowd,
    });
    setSubmitting(false);

    if (!ok) {
      setFailed(true); // 计时结果还在，用户可以再试一次
      return;
    }
    clearTimer();
    setTimer(null);
    setCrowd(null);
    setSubmitted(true);
  }

  if (!loaded) {
    return <div className="h-24" aria-hidden="true" />;
  }

  // 另一个机场或方向正在计时
  if (timer && !isMine) {
    return (
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
  }

  // 正在计时
  if (timer && running) {
    const atDesk = timer.reachedDeskAt !== null;
    return (
      <div className="space-y-4">
        <div className="bg-board px-5 py-4 text-sign" role="timer" aria-live="off">
          <p className="text-sm text-slate-300">
            {atDesk ? "已到窗口，正在办理" : "已排队"}
          </p>
          <p className="font-display text-6xl font-bold leading-none tabular-nums">
            {formatDuration(now - timer.startedAt)}
          </p>
          {atDesk && timer.reachedDeskAt !== null && (
            <p className="mt-2 text-sm text-slate-300">
              排队用了 {formatDuration(timer.reachedDeskAt - timer.startedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!atDesk && (
            <button type="button" onClick={reachDesk} className={secondaryButton}>
              我到窗口了（可选）
            </button>
          )}
          <button type="button" onClick={stop} className={primaryButton}>
            我已通过边检，结束计时
          </button>
          <button type="button" onClick={discard} className={secondaryButton}>
            取消计时
          </button>
        </div>
      </div>
    );
  }

  // 已结束，等待提交
  if (timer && timer.endedAt !== null) {
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

    return (
      <div className="space-y-4">
        <div className="bg-board px-5 py-4 text-sign">
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
        {failed && (
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
  }

  // 空闲
  return (
    <div className="space-y-3">
      <p className="leading-relaxed text-slate-700">
        排到队尾时点「开始计时」，通过边检后点「结束计时」。如果你愿意，走到窗口前再点一下
        「我到窗口了」，我们就能把排队和窗口办理分开记录。
      </p>
      <button type="button" onClick={start} className={primaryButton}>
        开始计时（{DIRECTION_LABEL[direction]}）
      </button>
      {submitted && (
        <p role="status" className="text-sm text-ok">
          已提交，谢谢你的报告。
        </p>
      )}
    </div>
  );
}
