"use client";

interface NumberBlocksProps {
  value: number;
  highlight?: "hundreds" | "tens" | "ones";
}

/** Place-value blocks: hundreds as gridded squares, tens as bars, ones as small cubes. Ink strokes; the highlighted place is yellow. */
export default function NumberBlocks({ value, highlight }: NumberBlocksProps) {
  const v = Math.max(0, Math.min(999, Math.round(value)));
  const hundreds = Math.floor(v / 100);
  const tens = Math.floor((v % 100) / 10);
  const ones = v % 10;
  const lit = (place: NumberBlocksProps["highlight"]) => (highlight === place ? "bg-yellow" : "bg-surface");
  return (
    <div className="flex flex-col items-center gap-4 motion animate-pop-in" aria-label={`${v}`}>
      <div className="flex items-end gap-5 flex-wrap justify-center max-w-[420px]" dir="ltr">
        {Array.from({ length: hundreds }, (_, i) => (
          <div key={"h" + i} className={`w-[88px] h-[88px] r-square ink grid grid-cols-10 grid-rows-10 gap-px p-1 ${lit("hundreds")}`}>
            {Array.from({ length: 100 }, (_, j) => (
              <span key={j} className="bg-ink/15 rounded-[1px]" />
            ))}
          </div>
        ))}
        {Array.from({ length: tens }, (_, i) => (
          <div key={"t" + i} className={`w-[18px] h-[88px] r-chip ink flex flex-col gap-px p-0.5 ${lit("tens")}`}>
            {Array.from({ length: 10 }, (_, j) => (
              <span key={j} className="flex-1 bg-ink/15 rounded-[1px]" />
            ))}
          </div>
        ))}
        <div className="grid grid-cols-5 gap-1.5 self-end">
          {Array.from({ length: ones }, (_, i) => (
            <div key={"o" + i} className={`w-[18px] h-[18px] r-square ink-2 ${lit("ones")}`} />
          ))}
        </div>
      </div>
      <div className="font-display text-[44px] font-bold leading-none tabular-nums" dir="ltr">
        {v}
      </div>
    </div>
  );
}
