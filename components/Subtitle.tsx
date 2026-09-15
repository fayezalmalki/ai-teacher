interface SubtitleProps {
  text: string;
  /** Re-mount (and fade up) whenever this changes. */
  id: string | number;
  /** Display size in px (v2: 34 for teacher speech). */
  size?: number;
  className?: string;
}

/** The one sentence the teacher says: Baloo 34/600, lh 1.45, max-width 460, fades up on change. */
export default function Subtitle({ text, id, size = 34, className = "" }: SubtitleProps) {
  return (
    <div
      key={id}
      className={"font-display font-semibold text-ink text-pretty-wrap max-w-[460px] motion animate-fade-up " + className}
      style={{ fontSize: size, lineHeight: 1.45 }}
    >
      {text}
    </div>
  );
}
