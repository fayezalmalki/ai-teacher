interface FractionGlyphProps {
  n: string;
  d: string;
  size?: 56 | 64;
  /** Tint the numerator primary (explanation legend). */
  highlightNumerator?: boolean;
}

/** A stacked fraction card: numerator, bar, denominator. */
export default function FractionGlyph({ n, d, size = 56, highlightNumerator }: FractionGlyphProps) {
  const big = size === 64;
  return (
    <div
      className={
        "flex flex-col items-center font-semibold leading-none text-ink bg-surface rounded-card border border-border-3 " +
        (big ? "px-10 py-6" : "px-9 py-6")
      }
      style={{ fontSize: size }}
    >
      <div className={highlightNumerator ? "text-primary" : undefined}>{n}</div>
      <div className={"h-[3px] bg-ink " + (big ? "w-16 my-3" : "w-14 my-2.5")} />
      <div>{d}</div>
    </div>
  );
}

export function FractionPair({ pairs }: { pairs: { n: string; d: string }[] }) {
  return (
    <div className="flex gap-10 items-center">
      {pairs.map((f, i) => (
        <FractionGlyph key={i} n={f.n} d={f.d} />
      ))}
    </div>
  );
}
