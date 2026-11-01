"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { SPRING } from "./motion";

interface Item<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  ariaLabel: string;
  items: Item<T>[];
  value: T;
  onChange: (id: T) => void;
  mode: "tabs" | "chips";
  className?: string;
}

export default function SlidingChoice<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  mode,
  className = "",
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef(new Map<string, HTMLButtonElement>());
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const btn = btnRefs.current.get(value);
    if (!root || !btn) return;

    const measure = () => {
      setBox({
        x: btn.offsetLeft,
        y: btn.offsetTop,
        w: btn.offsetWidth,
        h: btn.offsetHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const el of btnRefs.current.values()) observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [value, items]);

  const tabs = mode === "tabs";

  return (
    <div
      ref={rootRef}
      role={tabs ? "tablist" : "group"}
      aria-label={ariaLabel}
      className={
        tabs
          ? `relative flex rounded-full bg-white p-1 shadow-card ring-1 ring-black/[0.04] ${className}`
          : `relative flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`
      }
    >
      {box && (
        <m.div
          aria-hidden
          className="pointer-events-none absolute z-0 rounded-full bg-board shadow-sm"
          initial={false}
          animate={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          transition={SPRING}
        />
      )}
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) btnRefs.current.set(item.id, node);
              else btnRefs.current.delete(item.id);
            }}
            type="button"
            role={tabs ? "tab" : undefined}
            aria-selected={tabs ? selected : undefined}
            aria-pressed={tabs ? undefined : selected}
            onClick={() => onChange(item.id)}
            className={
              tabs
                ? `relative z-10 min-h-12 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 sm:text-base ${
                    selected ? "text-white" : "text-ink"
                  }`
                : `press relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors duration-200 ${
                    selected ? "text-white ring-transparent" : "bg-white text-ink ring-line hover:ring-board"
                  }`
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
