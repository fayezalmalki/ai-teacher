"use client";

interface MicButtonProps {
  recording: boolean;
  onTap: () => void;
}

/** Mic pill: Baloo 22 "تكلّم" → green fill "أسمعك…" while recording. */
export default function MicButton({ recording, onTap }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={recording}
      className={
        "flex items-center gap-3.5 px-8 py-[18px] rounded-pill ink font-display text-[22px] font-bold leading-none shadow-pop press motion animate-pop-in-fast transition-colors " +
        (recording ? "bg-success text-white" : "bg-surface text-ink")
      }
    >
      <span className="inline-block w-3.5 h-[22px] rounded-[7px] bg-current" />
      <span>{recording ? "أسمعك…" : "تكلّم"}</span>
    </button>
  );
}
