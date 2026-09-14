interface WaveformProps {
  /** Animate the 4 bars; otherwise render a still dot. */
  active: boolean;
  color?: string;
  height?: number;
}

/** 4-bar speaking/listening waveform, or an 8px dot when idle. */
export default function Waveform({ active, color = "currentColor", height = 14 }: WaveformProps) {
  if (!active) {
    return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />;
  }
  return (
    <span className="inline-flex items-center gap-[3px]" style={{ height }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-[2px] origin-center"
          style={{
            height,
            background: color,
            animation: `wave ${0.9 + i * 0.13}s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
