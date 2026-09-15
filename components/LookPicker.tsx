"use client";

import Character from "@/components/character/Character";
import { LOOK_LIST, type TeacherLook } from "@/lib/character/looks";

interface LookPickerProps {
  value: TeacherLook;
  onChange: (look: TeacherLook) => void;
  /** Avatar diameter. */
  size?: number;
}

/** Row of the teacher's looks; the chosen one gets the ink ring and blue shadow. */
export default function LookPicker({ value, onChange, size = 72 }: LookPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap" role="radiogroup" aria-label="شكل المعلم">
      {LOOK_LIST.map((l) => {
        const on = l.id === value;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={on}
            data-look={l.id}
            onClick={() => onChange(l.id)}
            className={
              "flex flex-col items-center gap-1.5 px-2 pt-2 pb-2.5 r-card-2 transition-[transform,box-shadow,background-color] duration-150 press " +
              (on ? "ink bg-surface shadow-tint-blue" : "ink-2 bg-transparent hover:bg-hover")
            }
          >
            <div className="r-avatar ink-2 bg-surface overflow-hidden" style={{ width: size, height: size }}>
              <Character mode="svg" size={size - 4} state="idle" look={l.id} />
            </div>
            <div className={"text-[13px] font-semibold " + (on ? "text-ink" : "text-muted")}>{l.name}</div>
          </button>
        );
      })}
    </div>
  );
}
