import type { Crowd } from "@/lib/types";
import { CROWD_HINT, CROWD_LABEL } from "@/lib/types";

const OPTIONS: Crowd[] = ["light", "moderate", "heavy"];

interface Props {
  value: Crowd | null;
  onChange: (value: Crowd | null) => void;
}

export default function CrowdPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="拥挤程度">
      {OPTIONS.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : option)}
            className={`min-h-14 border px-2 py-2 text-left ${
              selected
                ? "border-board bg-board text-white"
                : "border-line bg-white hover:border-board"
            }`}
          >
            <span className="block font-medium">{CROWD_LABEL[option]}</span>
            <span
              className={`block text-xs ${selected ? "text-slate-300" : "text-slate-600"}`}
            >
              {CROWD_HINT[option]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
