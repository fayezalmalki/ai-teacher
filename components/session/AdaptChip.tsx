interface AdaptChipProps {
  text: string;
  /** Level-up chips are green; strategy changes amber. */
  tone: "levelUp" | "strategy";
}

export default function AdaptChip({ text, tone }: AdaptChipProps) {
  const cls = tone === "levelUp" ? "bg-success-tint text-success" : "bg-warning-tint text-warning";
  return (
    <div className={"flex items-center gap-2.5 px-4 py-3 rounded-input text-[14px] font-medium animate-[fadeUp_.4s_ease] " + cls}>
      <span className="w-2 h-2 rounded-full bg-current flex-none" />
      <span>{text}</span>
    </div>
  );
}
