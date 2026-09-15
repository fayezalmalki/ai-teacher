"use client";

interface CycleProps {
  stages: string[];
  highlight?: number;
}

/** Stages drawn in a ring with arrows between them; the highlighted stage is filled yellow. */
export default function Cycle({ stages, highlight }: CycleProps) {
  const n = stages.length;
  const R = 105;
  const cx = 170;
  const cy = 150;
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  return (
    <div className="motion animate-pop-in w-full max-w-[380px]">
      <svg viewBox="0 0 340 300" width="100%" role="img" aria-label={stages.join(" ← ")} style={{ direction: "ltr" }}>
        <defs>
          <marker id="cyc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-ink)" />
          </marker>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--color-rule)" strokeWidth="2" strokeDasharray="6 6" />
        {stages.map((_, i) => {
          const a = pos(i);
          const b = pos((i + 1) % n);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = mx - cx;
          const dy = my - cy;
          const d = Math.hypot(dx, dy) || 1;
          const px = cx + (dx / d) * (R + 8);
          const py = cy + (dy / d) * (R + 8);
          const ax = a.x + (px - a.x) * 0.45;
          const ay = a.y + (py - a.y) * 0.45;
          const bx = b.x + (px - b.x) * 0.45;
          const by = b.y + (py - b.y) * 0.45;
          return <path key={i} d={`M ${ax} ${ay} Q ${px} ${py} ${bx} ${by}`} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" markerEnd="url(#cyc-arrow)" />;
        })}
        {stages.map((s, i) => {
          const p = pos(i);
          const lit = highlight === i;
          return (
            <g key={s}>
              <circle cx={p.x} cy={p.y} r="38" fill={lit ? "var(--color-yellow)" : "var(--color-surface)"} stroke="var(--color-ink)" strokeWidth="3" />
              <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-ink)" fontFamily="var(--font-baloo), sans-serif" direction="rtl">
                {s}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
