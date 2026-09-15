"use client";

import { cardRadius } from "@/components/Sketch";
import { isLatin, toArabicDigits } from "@/lib/format";

interface CardsProps {
  items: { label: string; icon?: string; sub?: string }[];
  highlight?: number;
  numbered?: boolean;
}

/** A row of small cards (words, organs, pillars). The highlighted card fills yellow and lifts. */
export default function Cards({ items, highlight, numbered }: CardsProps) {
  // English items read left-to-right, so the row (and its numbering) flips direction.
  const latin = items.every((it) => isLatin(it.label));
  return (
    <div className="motion animate-pop-in flex gap-3 flex-wrap justify-center max-w-[420px]" dir={latin ? "ltr" : undefined} lang={latin ? "en" : undefined}>
      {items.map((it, i) => {
        const lit = highlight === i;
        return (
          <div
            key={i}
            className={
              `flex flex-col items-center gap-1.5 px-4 py-3.5 min-w-[92px] ${cardRadius(i)} ink transition-[transform,background-color] duration-200 ` +
              (lit ? "bg-yellow -translate-y-1 shadow-tint-blue" : "bg-surface")
            }
          >
            {numbered && <div className="w-7 h-7 r-dot ink-2 grid place-items-center font-display text-[15px] font-bold bg-surface">{latin ? i + 1 : toArabicDigits(i + 1)}</div>}
            {it.icon && (
              <div className="text-[30px] leading-none" aria-hidden="true">
                {it.icon}
              </div>
            )}
            <div className="font-display text-[20px] font-bold text-ink leading-tight">{it.label}</div>
            {it.sub && <div className="text-[12px] text-muted">{it.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}
