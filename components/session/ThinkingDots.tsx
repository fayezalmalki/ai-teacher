export default function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-primary"
          style={{ animation: `dots 1.2s ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}
