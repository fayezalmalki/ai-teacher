interface ProgressDotsProps {
  done: boolean[];
}

/** Session header progress: 10px dots, primary when done. */
export default function ProgressDots({ done }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2" aria-label="التقدم في الدرس">
      {done.map((d, i) => (
        <div
          key={i}
          className={"w-2.5 h-2.5 rounded-full transition-colors duration-[400ms] " + (d ? "bg-primary" : "bg-border-2")}
        />
      ))}
    </div>
  );
}
