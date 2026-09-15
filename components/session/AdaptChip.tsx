interface AdaptChipProps {
  text: string;
  /** Kept for call-site compatibility; v2 shows both tones the same way. */
  tone?: "levelUp" | "strategy";
}

/** v2 adaptation note: a small muted line with a dashed underline, under the sentence. */
export default function AdaptChip({ text }: AdaptChipProps) {
  return <div className="text-[14px] text-muted border-b-2 border-dashed border-rule pb-1 motion animate-fade-up">{text}</div>;
}
