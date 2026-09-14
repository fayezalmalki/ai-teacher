interface SubtitleProps {
  text: string;
  /** Re-mount (and fade up) whenever this changes. */
  id: string | number;
  size?: 24 | 26;
}

/** Teacher speech subtitle: 24–26/500, lh 1.65, max-width 440, fades up on change. */
export default function Subtitle({ text, id, size = 24 }: SubtitleProps) {
  return (
    <div
      key={id}
      className="font-medium text-ink text-pretty-wrap max-w-[440px] animate-fade-up"
      style={{ fontSize: size, lineHeight: 1.65 }}
    >
      {text}
    </div>
  );
}
