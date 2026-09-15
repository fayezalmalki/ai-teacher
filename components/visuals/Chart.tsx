"use client";

import type { VisualSpec } from "@/lib/lesson-engine/types";

type ChartSpec = Extract<VisualSpec, { kind: "chart" }>;

const FONT = "var(--font-baloo), sans-serif";
const COLORS = ["var(--color-primary)", "var(--color-error)", "var(--color-success)", "var(--color-yellow)", "#9B7BD9"];

/** Bar, pie and box charts in the hand-drawn style: ink strokes, flat fills, the highlighted part in yellow. */
export default function Chart({ spec }: { spec: ChartSpec }) {
  if (spec.type === "bar") return <BarChart spec={spec} />;
  if (spec.type === "pie") return <PieChart spec={spec} />;
  return <BoxPlot spec={spec} />;
}

function BarChart({ spec }: { spec: Extract<ChartSpec, { type: "bar" }> }) {
  const W = 380;
  const H = 260;
  const padL = 44;
  const padB = 46;
  const padT = 26;
  const max = Math.max(1, ...spec.values);
  const step = max > 50 ? 20 : max > 20 ? 10 : 5;
  const top = Math.ceil(max / step) * step;
  const n = spec.values.length;
  const bw = (W - padL - 16) / n;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const lit = new Set(spec.highlight ?? []);
  return (
    <div className="motion animate-pop-in w-full max-w-[400px]">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={spec.categories.map((c, i) => `${c}: ${spec.values[i]}`).join("، ")} style={{ direction: "ltr" }}>
        {Array.from({ length: top / step + 1 }, (_, i) => i * step).map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - 12} y1={y(v)} y2={y(v)} stroke="var(--color-rule)" strokeDasharray="4 4" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)" fontFamily={FONT}>
              {v}
            </text>
          </g>
        ))}
        {spec.values.map((v, i) => {
          const x = padL + i * bw + bw * 0.15;
          return (
            <g key={i}>
              <rect x={x} y={y(v)} width={bw * 0.7} height={y(0) - y(v)} fill={lit.has(i) ? "var(--color-yellow)" : COLORS[i % COLORS.length]} fillOpacity={lit.size && !lit.has(i) ? 0.35 : 1} stroke="var(--color-ink)" strokeWidth="2.5" rx="3" />
              <text x={x + bw * 0.35} y={y(v) - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-ink)" fontFamily={FONT}>
                {v}
              </text>
              <text x={x + bw * 0.35} y={H - padB + 18} textAnchor="middle" fontSize="12" fill="var(--color-ink)" fontFamily={FONT} direction="rtl">
                {spec.categories[i]}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={W - 12} y1={y(0)} y2={y(0)} stroke="var(--color-ink)" strokeWidth="2.5" />
        <line x1={padL} x2={padL} y1={padT} y2={y(0)} stroke="var(--color-ink)" strokeWidth="2.5" />
        {spec.xLabel && (
          <text x={(padL + W) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--color-muted)" fontFamily={FONT} direction="rtl">
            {spec.xLabel}
          </text>
        )}
        {spec.yLabel && (
          <text x={padL + 8} y={14} textAnchor="middle" fontSize="12" fill="var(--color-muted)" fontFamily={FONT} direction="rtl">
            {spec.yLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

function PieChart({ spec }: { spec: Extract<ChartSpec, { type: "pie" }> }) {
  const total = spec.slices.reduce((a, s) => a + s.value, 0);
  const cx = 110;
  const cy = 110;
  const R = 92;
  let angle = -Math.PI / 2;
  const arcs = spec.slices.map((s, i) => {
    const a0 = angle;
    const a1 = angle + (s.value / total) * Math.PI * 2;
    angle = a1;
    const mid = (a0 + a1) / 2;
    const lit = spec.highlight === i;
    const off = lit ? 8 : 0;
    const ox = Math.cos(mid) * off;
    const oy = Math.sin(mid) * off;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M ${cx + ox} ${cy + oy} L ${cx + ox + R * Math.cos(a0)} ${cy + oy + R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${cx + ox + R * Math.cos(a1)} ${cy + oy + R * Math.sin(a1)} Z`;
    const lx = cx + ox + R * 0.62 * Math.cos(mid);
    const ly = cy + oy + R * 0.62 * Math.sin(mid);
    return { d, lx, ly, lit, i, s, pct: Math.round((s.value / total) * 100) };
  });
  return (
    <div className="motion animate-pop-in flex items-center gap-5 flex-wrap justify-center">
      <svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label={spec.slices.map((s) => `${s.label} ${s.value}%`).join("، ")} style={{ direction: "ltr" }}>
        {arcs.map((a) => (
          <path key={a.i} d={a.d} fill={a.lit ? "var(--color-yellow)" : COLORS[a.i % COLORS.length]} stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
        ))}
        {arcs.map((a) => (
          <text key={"t" + a.i} x={a.lx} y={a.ly + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={a.lit ? "var(--color-ink)" : "#fff"} fontFamily={FONT}>
            {a.pct}%
          </text>
        ))}
      </svg>
      <div className="flex flex-col gap-1.5 text-[15px]">
        {spec.slices.map((s, i) => (
          <div key={i} className={"flex items-center gap-2 " + (spec.highlight === i ? "font-bold" : "")}>
            <span className="inline-block w-4 h-4 rounded-[4px] ink-2" style={{ background: spec.highlight === i ? "var(--color-yellow)" : COLORS[i % COLORS.length] }} />
            <span>{s.label}</span>
            <span className="text-muted tabular-nums">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoxPlot({ spec }: { spec: Extract<ChartSpec, { type: "box" }> }) {
  const from = spec.from ?? Math.min(0, spec.min);
  const to = spec.to ?? spec.max;
  const W = 380;
  const padX = 24;
  const x = (v: number) => padX + ((v - from) / (to - from || 1)) * (W - padX * 2);
  const yMid = 70;
  const h = 44;
  const lit = spec.highlight;
  const stroke = (part: string) => (lit === part ? "var(--color-yellow)" : "var(--color-ink)");
  const ticks: number[] = [];
  const step = (to - from) / 6;
  for (let i = 0; i <= 6; i++) ticks.push(Math.round(from + i * step));
  return (
    <div className="motion animate-pop-in w-full max-w-[400px]">
      <svg viewBox={`0 0 ${W} 150`} width="100%" role="img" aria-label={`الصندوق من ${spec.q1} إلى ${spec.q3}، الوسيط ${spec.median}، الطرفان ${spec.min} و${spec.max}`} style={{ direction: "ltr" }}>
        <line x1={x(spec.min)} x2={x(spec.q1)} y1={yMid} y2={yMid} stroke={stroke("left")} strokeWidth={lit === "left" ? 6 : 3} />
        <line x1={x(spec.min)} x2={x(spec.min)} y1={yMid - 14} y2={yMid + 14} stroke="var(--color-ink)" strokeWidth="3" />
        <line x1={x(spec.q3)} x2={x(spec.max)} y1={yMid} y2={yMid} stroke={stroke("right")} strokeWidth={lit === "right" ? 6 : 3} />
        <line x1={x(spec.max)} x2={x(spec.max)} y1={yMid - 14} y2={yMid + 14} stroke="var(--color-ink)" strokeWidth="3" />
        <rect x={x(spec.q1)} y={yMid - h / 2} width={x(spec.q3) - x(spec.q1)} height={h} fill={lit === "box" ? "var(--color-yellow)" : "var(--color-primary-tint)"} stroke="var(--color-ink)" strokeWidth="3" rx="4" />
        <line x1={x(spec.median)} x2={x(spec.median)} y1={yMid - h / 2} y2={yMid + h / 2} stroke={lit === "median" ? "var(--color-yellow)" : "var(--color-error)"} strokeWidth={lit === "median" ? 6 : 4} />
        <line x1={padX} x2={W - padX} y1={118} y2={118} stroke="var(--color-ink)" strokeWidth="2" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={114} y2={122} stroke="var(--color-ink)" strokeWidth="2" />
            <text x={x(t)} y={138} textAnchor="middle" fontSize="11" fill="var(--color-muted)" fontFamily={FONT}>
              {t}
            </text>
          </g>
        ))}
        {[spec.min, spec.q1, spec.median, spec.q3, spec.max].map((v, i) => (
          <text key={i} x={x(v)} y={yMid - h / 2 - 8 - (i % 2 ? 0 : 0)} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-ink)" fontFamily={FONT}>
            {v}
          </text>
        ))}
        {spec.label && (
          <text x={W / 2} y={16} textAnchor="middle" fontSize="13" fill="var(--color-muted)" fontFamily={FONT} direction="rtl">
            {spec.label}
          </text>
        )}
      </svg>
    </div>
  );
}
