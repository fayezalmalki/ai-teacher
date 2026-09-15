"use client";

interface NumberLineProps {
  from: number;
  to: number;
  step?: number;
  /** A marked point on the line. */
  start?: number;
  /** Draws an arc of this size from `start` (negative = backwards). */
  jump?: number;
}

/** Hand-drawn number line: ink baseline, ticks, a blue dot at `start` and a dashed arc for the jump. */
export default function NumberLine({ from, to, step, start, jump }: NumberLineProps) {
  const span = to - from;
  const tick = step ?? (span <= 20 ? 1 : span <= 100 ? 10 : 100);
  const W = 420;
  const H = 120;
  const pad = 28;
  const x = (n: number) => pad + ((n - from) / span) * (W - pad * 2);
  const ticks: number[] = [];
  for (let n = from; n <= to + 1e-9; n += tick) ticks.push(n);
  const end = start !== undefined && jump ? Math.max(from, Math.min(to, start + jump)) : undefined;
  return (
    <div className="motion animate-pop-in w-full max-w-[440px]">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`خط أعداد من ${from} إلى ${to}`} style={{ direction: "ltr" }}>
        <line x1={pad - 10} y1={80} x2={W - pad + 10} y2={80} stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
        {ticks.map((n) => (
          <g key={n}>
            <line x1={x(n)} y1={72} x2={x(n)} y2={88} stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <text x={x(n)} y={108} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--color-ink-2)" fontFamily="var(--font-baloo), sans-serif">
              {n}
            </text>
          </g>
        ))}
        {start !== undefined && end !== undefined && (
          <path
            d={`M ${x(start)} 74 Q ${(x(start) + x(end)) / 2} ${74 - Math.min(52, Math.abs(x(end) - x(start)) * 0.6)} ${x(end)} 74`}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        )}
        {end !== undefined && <polygon points={`${x(end)},78 ${x(end) - 6},68 ${x(end) + 6},68`} fill="var(--color-primary)" />}
        {start !== undefined && <circle cx={x(start)} cy={80} r="8" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="3" />}
      </svg>
    </div>
  );
}
