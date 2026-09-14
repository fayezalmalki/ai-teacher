"use client";

import type { Choice } from "@/lib/lesson-engine/types";

interface ChoicesProps {
  choices: Choice[];
  onPick: (index: number) => void;
}

/** Answer buttons: min-width 120, 22/600, 2px border, hover blue. */
export default function Choices({ choices, onPick }: ChoicesProps) {
  return (
    <>
      {choices.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          className="min-w-[120px] px-7 py-4 rounded-tile border-2 border-border-2 bg-surface text-[22px] font-semibold text-ink transition-all duration-200 hover:border-primary hover:bg-primary-tint-2"
        >
          {c.l}
        </button>
      ))}
    </>
  );
}
