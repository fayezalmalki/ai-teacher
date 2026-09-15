"use client";

interface RulerProps {
  /** Length of the object in centimetres. */
  length: number;
  max?: number;
  label?: string;
}

/** A centimetre ruler with a pencil-shaped object laid along it from 0. */
export default function Ruler({ length, max, label = "" }: RulerProps) {
  const top = max ?? Math.max(10, Math.ceil(length / 5) * 5);
  const W = 440;
  const pad = 24;
  const x = (n: number) => pad + (n / top) * (W - pad * 2);
  const marks = Array.from({ length: top + 1 }, (_, i) => i);
  const labelEvery = top > 20 ? 5 : top > 12 ? 2 : 1;
  const len = Math.min(length, top);
  return (
    <div className="motion animate-pop-in w-full max-w-[460px] flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} 150`} width="100%" role="img" aria-label={`مسطرة، الطول ${length} سم`} style={{ direction: "ltr" }}>
        {/* the object */}
        <rect x={x(0)} y={22} width={x(len) - x(0)} height={30} rx="10" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="3" />
        <polygon points={`${x(len)},22 ${x(len) + 16},37 ${x(len)},52`} fill="var(--color-pizza)" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
        {/* the ruler */}
        <rect x={pad - 12} y={70} width={W - pad * 2 + 24} height={64} rx="8" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
        {marks.map((n) => (
          <g key={n}>
            <line x1={x(n)} y1={70} x2={x(n)} y2={n % labelEvery === 0 ? 92 : 82} stroke="var(--color-ink)" strokeWidth={n % labelEvery === 0 ? 2.5 : 1.5} />
            {n % labelEvery === 0 && (
              <text x={x(n)} y={118} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--color-ink)" fontFamily="var(--font-baloo), sans-serif">
                {n}
              </text>
            )}
          </g>
        ))}
        <text x={W - pad} y={132} textAnchor="end" fontSize="11" fill="var(--color-muted)">
          سم
        </text>
      </svg>
      {label && <div className="text-[15px] text-muted">{label}</div>}
    </div>
  );
}
