"use client";

export type ChocolateMode = "one" | "pick" | "two";

interface ChocolateProps {
  mode: ChocolateMode;
  selected?: number[];
  canPick?: boolean;
  onToggle?: (index: number) => void;
}

export function chocolateCaption(mode: ChocolateMode, selectedCount: number): string {
  if (mode === "one") return "واحد من أربع";
  if (mode === "two") return "اثنان من أربع";
  return selectedCount < 2 ? "" : "كم أخذنا؟";
}

/** 2×2 chocolate: brown squares; taken pieces are hatched and tilted. */
export default function Chocolate({ mode, selected = [], canPick = false, onToggle }: ChocolateProps) {
  const caption = chocolateCaption(mode, selected.length);
  return (
    <div className="flex flex-col items-center gap-4 motion animate-pop-in">
      <div className="grid grid-cols-2 gap-2 p-2.5 ink r-row bg-surface" style={{ boxShadow: "8px 8px 0 var(--color-pizza-shadow)" }}>
        {[0, 1, 2, 3].map((i) => {
          const lit = mode === "one" ? i === 0 : mode === "two" ? i < 2 : selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={lit}
              aria-label={`قطعة ${i + 1}`}
              onClick={() => canPick && onToggle?.(i)}
              className={"w-[100px] h-[100px] r-square ink transition-all duration-[250ms] " + (lit ? "hatch bg-surface" : "bg-choc")}
              style={{ cursor: canPick ? "pointer" : "default", transform: lit ? "rotate(-2deg) scale(.97)" : "none" }}
            />
          );
        })}
      </div>
      {caption && <div className="text-[15px] text-muted">{caption}</div>}
    </div>
  );
}
