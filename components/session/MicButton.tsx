"use client";

interface MicButtonProps {
  recording: boolean;
  onTap: () => void;
}

/** Mic pill: "اضغط للتحدث" → "أسمعك…" while recording. */
export default function MicButton({ recording, onTap }: MicButtonProps) {
  return (
    <div className="flex items-center gap-5 flex-wrap justify-center">
      <button
        type="button"
        onClick={onTap}
        aria-pressed={recording}
        className="flex items-center gap-3.5 px-7 py-4 rounded-pill border-0 bg-primary text-white text-[17px] font-semibold shadow-primary hover:bg-primary-hover"
      >
        <span className="inline-block w-3.5 h-[22px] rounded-[7px] bg-white" />
        <span>{recording ? "أسمعك…" : "اضغط للتحدث"}</span>
      </button>
      <span className="text-[15px] text-muted">خذ وقتك، أنا أسمعك.</span>
    </div>
  );
}
