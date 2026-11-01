"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, m, useReducedMotion } from "motion/react";
import { EASE } from "./motion";

interface Props {
  minutes: number | null;
  loading?: boolean;
  size?: "sm" | "lg";
}

function AnimatedInt({ value, className }: { value: number; className: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (reduce || from === value) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.48,
      ease: EASE,
      onUpdate: (next) => {
        const rounded = Math.round(next);
        shownRef.current = rounded;
        setShown(rounded);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{shown}</span>;
}

/** 在深蓝色看板上显示等待时间；没有数据时明确显示“暂无数据” */
export default function WaitReadout({ minutes, loading = false, size = "sm" }: Props) {
  const big = size === "lg";
  const state = loading ? "loading" : minutes === null ? "empty" : "value";

  return (
    <div className={big ? "min-h-24" : "min-h-10"}>
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "loading" ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`skeleton-dark rounded-2xl ${big ? "h-20 w-48" : "h-8 w-24"}`}
          />
        ) : state === "empty" ? (
          <m.p
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            className={`font-medium text-slate-300 ${big ? "text-4xl" : "text-lg"}`}
          >
            暂无数据
          </m.p>
        ) : (
          <m.p
            key="value"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="text-sign"
          >
            <AnimatedInt
              value={minutes ?? 0}
              className={`font-display font-bold leading-none tabular-nums ${big ? "text-8xl" : "text-4xl"}`}
            />
            <span className={`ml-1 font-medium ${big ? "text-2xl" : "text-base"}`}>分钟</span>
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
