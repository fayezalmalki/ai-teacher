"use client";

import Pizza from "./Pizza";

interface CompareCirclesProps {
  canPick?: boolean;
  onPick?: (value: string) => void;
  labels?: Record<string, string>;
}

const CIRCLES: { value: string; filled: 1 | 2; dividers: "v" | "vh" }[] = [
  { value: "half", filled: 2, dividers: "v" },
  { value: "quarter", filled: 1, dividers: "vh" },
];

/** Two hatched circles (half vs quarter); tappable while the teacher waits. */
export default function CompareCircles({ canPick = false, onPick, labels = { half: "الأولى", quarter: "الثانية" } }: CompareCirclesProps) {
  return (
    <div className="flex gap-10 items-start flex-wrap justify-center motion animate-pop-in">
      {CIRCLES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => canPick && onPick?.(c.value)}
          className={"flex flex-col items-center gap-3.5 bg-transparent border-0 p-2.5 transition-transform duration-200 " + (canPick ? "hover:-translate-y-1 hover:-rotate-1" : "")}
          style={{ cursor: canPick ? "pointer" : "default" }}
        >
          <Pizza size={170} filled={c.filled} dividers={c.dividers} pop={false} className="[&>div]:shadow-[6px_6px_0_var(--color-pizza-shadow)]" />
          <div className="font-display text-[22px] font-semibold text-ink">{labels[c.value] ?? c.value}</div>
        </button>
      ))}
    </div>
  );
}
