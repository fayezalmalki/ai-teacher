"use client";

interface WordCardProps {
  text: string;
  /** Character indexes drawn in blue (e.g. the tanween mark). */
  marks?: number[];
  caption?: string;
}

/**
 * One big word on a card, for reading lessons. Characters are wrapped one by
 * one so a mark can be tinted; Arabic shaping still joins across the spans.
 */
export default function WordCard({ text, marks = [], caption }: WordCardProps) {
  const lit = new Set(marks);
  const chars = Array.from(text);
  return (
    <div className="motion animate-pop-in flex flex-col items-center gap-4">
      <div className="px-10 py-7 r-card-1 ink bg-surface shadow-tint-yellow min-w-[220px] text-center">
        <div className="font-display font-bold leading-[1.4] text-ink whitespace-nowrap" style={{ fontSize: chars.length > 9 ? "clamp(30px, 6vw, 48px)" : "clamp(56px, 12vw, 88px)" }} lang="ar" dir="rtl" aria-label={text}>
          {chars.map((ch, i) => (
            <span key={i} className={lit.has(i) ? "text-primary" : undefined}>
              {ch}
            </span>
          ))}
        </div>
      </div>
      {caption && <div className="text-[16px] text-ink-2 font-semibold">{caption}</div>}
    </div>
  );
}
