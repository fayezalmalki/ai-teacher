"use client";

export type ChocolateMode = "one" | "pick" | "two";

interface ChocolateProps {
  mode: ChocolateMode;
  selected?: number[];
  /** Squares are tappable (pick mode while the teacher waits). */
  canPick?: boolean;
  onToggle?: (index: number) => void;
}

export function chocolateCaption(mode: ChocolateMode, selectedCount: number): string {
  if (mode === "one") return "شوكولاتة من 4 قطع متساوية";
  if (mode === "two") return "قطعتان من أربع = نصف";
  return selectedCount < 2 ? "المس قطعتين من الشوكولاتة" : "قطعتان محددتان — كم أخذنا؟";
}

/** 2×2 chocolate bar. Lit squares are the "taken" pieces. */
export default function Chocolate({ mode, selected = [], canPick = false, onToggle }: ChocolateProps) {
  return (
    <div className="flex flex-col items-center gap-[18px]">
      <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-choc-bar rounded-tile">
        {[0, 1, 2, 3].map((i) => {
          const lit = mode === "one" ? i === 0 : mode === "two" ? i < 2 : selected.includes(i);
          const label = lit && mode === "one" ? "1 من 4" : "";
          return (
            <button
              key={i}
              type="button"
              aria-pressed={lit}
              aria-label={`قطعة ${i + 1}`}
              onClick={() => canPick && onToggle?.(i)}
              className="w-24 h-24 rounded-small border-[3px] transition-all duration-[250ms] grid place-items-center text-white text-[15px] font-semibold"
              style={{
                background: lit ? "var(--color-choc-lit)" : "var(--color-choc)",
                borderColor: lit ? "var(--color-choc-lit-edge)" : "var(--color-choc-edge)",
                cursor: canPick ? "pointer" : "default",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="text-[15px] text-muted">{chocolateCaption(mode, selected.length)}</div>
    </div>
  );
}
