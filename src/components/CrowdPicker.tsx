"use client";

import { useId } from "react";
import { LayoutGroup, m } from "motion/react";
import type { Crowd } from "@/lib/types";
import { CROWD_HINT, CROWD_LABEL } from "@/lib/types";
import { SPRING } from "./motion";

const OPTIONS: Crowd[] = ["light", "moderate", "heavy"];

interface Props {
  value: Crowd | null;
  onChange: (value: Crowd | null) => void;
}

export default function CrowdPicker({ value, onChange }: Props) {
  const group = useId();

  return (
    <LayoutGroup id={group}>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="拥挤程度">
        {OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option)}
              className={`press relative min-h-16 overflow-hidden rounded-2xl border px-3 py-2 text-left ${
                selected ? "border-board text-white" : "border-line bg-white text-ink hover:border-board"
              }`}
            >
              {selected && (
                <m.span
                  layoutId="crowd-fill"
                  className="absolute inset-0 bg-board"
                  transition={SPRING}
                />
              )}
              <span className="relative z-10 block font-medium">{CROWD_LABEL[option]}</span>
              <span className={`relative z-10 block text-xs ${selected ? "text-slate-300" : "text-slate-600"}`}>
                {CROWD_HINT[option]}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
