export type TeacherState = "idle" | "listening" | "thinking" | "speaking" | "encouraging";

interface TeacherProps {
  size?: number;
  state?: TeacherState;
  /** Border width of the inner circle. */
  border?: number;
  /** Ring offset (negative inset) in px. */
  ringInset?: number;
  ringDuration?: string;
  glyphSize?: number;
  badgeSize?: number;
  /** Force the ✓ badge regardless of state. */
  badge?: boolean;
  onClick?: () => void;
}

/**
 * The teacher character ("ن" in a circle). Ring animates while speaking or
 * listening; a green ✓ badge appears while encouraging. Replace with the 2D
 * character (5 states) when available.
 */
export default function Teacher({
  size = 128,
  state = "idle",
  border = 6,
  ringInset = 6,
  ringDuration = "1.6s",
  glyphSize,
  badgeSize = 40,
  badge,
  onClick,
}: TeacherProps) {
  const ring = state === "speaking" || state === "listening" || state === "encouraging";
  const ringColor = state === "listening" ? "var(--color-success)" : "var(--color-primary)";
  const showBadge = badge ?? state === "encouraging";
  const glyph = glyphSize ?? Math.round(size * 0.41);
  return (
    <div className="relative select-none" style={{ width: size, height: size }} onClick={onClick}>
      {ring && (
        <span
          key={state}
          className="absolute rounded-full"
          style={{
            inset: -ringInset,
            border: `3px solid ${ringColor}`,
            animation: `ring ${ringDuration} ease-out infinite`,
          }}
        />
      )}
      <div
        className="absolute inset-0 rounded-full bg-primary-tint text-primary grid place-items-center font-bold transition-transform duration-300"
        style={{ fontSize: glyph, border: `${border}px solid var(--color-primary-tint-2)` }}
      >
        ن
      </div>
      {showBadge && (
        <div
          className="absolute -bottom-1 -left-1 rounded-full bg-success text-white grid place-items-center border-[3px] border-white"
          style={{ width: badgeSize, height: badgeSize, fontSize: Math.round(badgeSize / 2) }}
        >
          ✓
        </div>
      )}
    </div>
  );
}
