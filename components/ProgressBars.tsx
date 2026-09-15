interface ProgressBarsProps {
  total: number;
  filled: number;
}

/** v2 onboarding progress: 6px ink-bordered bars, filled blue. */
export default function ProgressBars({ total, filled }: ProgressBarsProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={"h-1.5 flex-1 rounded-[3px] ink-2 transition-colors duration-300 " + (i < filled ? "bg-primary" : "bg-surface")} />
      ))}
    </div>
  );
}
