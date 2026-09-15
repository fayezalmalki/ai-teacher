import { toArabicDigits } from "@/lib/format";

interface FractionGlyphProps {
  n: string;
  d: string;
  /** Numeral size in px (72 in the session, 84 in explanation mode). */
  size?: number;
  highlightNumerator?: boolean;
}

/** Baloo numerals with a slightly tilted ink bar. Digits display as Arabic-Indic. */
export default function FractionGlyph({ n, d, size = 72, highlightNumerator }: FractionGlyphProps) {
  const bar = size >= 84 ? 72 : 64;
  return (
    <div className="flex flex-col items-center font-display font-bold leading-none text-ink" style={{ fontSize: size }}>
      <div className={highlightNumerator ? "text-primary" : undefined}>{toArabicDigits(n)}</div>
      <div className="h-1 bg-ink rounded-[2px] my-2" style={{ width: bar, transform: "rotate(-2deg)" }} />
      <div>{toArabicDigits(d)}</div>
    </div>
  );
}

export function FractionPair({ pairs, pop = true }: { pairs: { n: string; d: string }[]; pop?: boolean }) {
  return (
    <div className={"flex gap-11 items-center " + (pop ? "motion animate-pop-in" : "")}>
      {pairs.map((f, i) => (
        <FractionGlyph key={i} n={f.n} d={f.d} />
      ))}
    </div>
  );
}
