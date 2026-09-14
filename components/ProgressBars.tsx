interface ProgressBarsProps {
  total: number;
  /** Number of filled bars. */
  filled: number;
}

/** Thin 4px segment bars (onboarding steps, explanation steps). */
export default function ProgressBars({ total, filled }: ProgressBarsProps) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={"h-1 flex-1 rounded-[2px] transition-colors duration-300 " + (i < filled ? "bg-primary" : "bg-border")}
        />
      ))}
    </div>
  );
}
