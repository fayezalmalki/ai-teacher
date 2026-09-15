"use client";

interface BalanceProps {
  left: number;
  right: number;
  leftLabel?: string;
  rightLabel?: string;
}

/** A balance scale: the heavier pan drops. Labels sit under the pans. */
export default function Balance({ left, right, leftLabel = "", rightLabel = "" }: BalanceProps) {
  const diff = right === left ? 0 : right > left ? 1 : -1;
  const tilt = diff * 9;
  return (
    <div className="motion animate-pop-in w-full max-w-[420px] flex flex-col items-center gap-2">
      <svg viewBox="0 0 400 230" width="100%" role="img" aria-label="ميزان" style={{ direction: "ltr" }}>
        {/* base */}
        <path d="M150 210 h100 l-14 -18 h-72 z" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="194" y="70" width="12" height="122" rx="4" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "200px 70px", transition: "transform .6s cubic-bezier(.34,1.56,.64,1)" }}>
          <rect x="60" y="64" width="280" height="12" rx="6" fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth="3" />
          <circle cx="200" cy="70" r="10" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="3" />
          {[70, 330].map((cx, i) => (
            <g key={i}>
              <line x1={cx} y1={76} x2={cx - 34} y2={130} stroke="var(--color-ink)" strokeWidth="2.5" />
              <line x1={cx} y1={76} x2={cx + 34} y2={130} stroke="var(--color-ink)" strokeWidth="2.5" />
              <path d={`M${cx - 44} 130 h88 q0 26 -44 30 q-44 -4 -44 -30 z`} fill={i === 0 ? "var(--color-primary-tint)" : "var(--color-success-tint)"} stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
              <text x={cx} y="150" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-ink)" fontFamily="var(--font-baloo), sans-serif">
                {i === 0 ? left : right}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between w-full max-w-[380px] px-4 text-[15px] font-semibold" dir="ltr">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
