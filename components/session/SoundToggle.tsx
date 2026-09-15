"use client";

interface SoundToggleProps {
  reading: boolean;
  onToggle: () => void;
}

/** 34px ink circle in the session chrome: speaker on (voice) or off (reading mode). */
export default function SoundToggle({ reading, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={reading}
      aria-label={reading ? "تشغيل الصوت" : "إيقاف الصوت"}
      title={reading ? "وضع القراءة: اضغط لتشغيل الصوت" : "اضغط للدرس بدون صوت"}
      className={"w-[34px] h-[34px] r-dot ink-2 grid place-items-center hover:bg-hover " + (reading ? "bg-yellow" : "bg-surface")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10v4h4l5 4V6L8 10H4z" />
        {reading ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
      </svg>
    </button>
  );
}
