"use client";

import Pizza from "./Pizza";

interface CompareCirclesProps {
  canPick?: boolean;
  onPick?: (value: string) => void;
  labels?: Record<string, string>;
}

const CIRCLES: { value: string; filled: number; lines: 1 | 2 }[] = [
  { value: "half", filled: 0.5, lines: 1 },
  { value: "quarter", filled: 0.25, lines: 2 },
];

/** Two comparison circles (half vs quarter); tappable when the teacher waits. */
export default function CompareCircles({
  canPick = false,
  onPick,
  labels = { half: "الأولى", quarter: "الثانية" },
}: CompareCirclesProps) {
  return (
    <div className="flex gap-9 items-start flex-wrap justify-center">
      {CIRCLES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => canPick && onPick?.(c.value)}
          className="flex flex-col items-center gap-3.5 bg-transparent border-0 p-3 rounded-card transition-[outline-color] duration-[250ms]"
          style={{
            cursor: canPick ? "pointer" : "default",
            outline: `3px solid ${canPick ? "var(--color-primary-outline)" : "transparent"}`,
            outlineOffset: 2,
          }}
        >
          <Pizza size={160} border={8} filled={c.filled} lines={c.lines} />
          <div className="text-[22px] font-semibold text-ink">{labels[c.value] ?? c.value}</div>
        </button>
      ))}
    </div>
  );
}
