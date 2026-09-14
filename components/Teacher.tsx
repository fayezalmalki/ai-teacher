import type { Viseme } from "@/lib/voice/types";

export type TeacherState = "idle" | "listening" | "thinking" | "speaking" | "encouraging";

/** Mouth geometry per grouped viseme: [width, height, radius] as a fraction of the character size. */
const MOUTH: Record<Viseme, [number, number, number]> = {
  0: [0.16, 0.03, 0.02], // rest
  1: [0.16, 0.11, 0.06], // open
  2: [0.09, 0.09, 0.05], // round
  3: [0.2, 0.05, 0.03], // wide
  4: [0.14, 0.025, 0.02], // lips closed
  5: [0.15, 0.045, 0.02], // lip-teeth
  6: [0.15, 0.06, 0.03], // tongue-teeth
  7: [0.13, 0.08, 0.04], // back
};

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
  /**
   * Current mouth shape from the voice adapter. When provided (even 0) a small
   * mouth is drawn under the glyph; this is the hook the Rive character will
   * replace with its `viseme` input.
   */
  viseme?: Viseme;
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
  viseme,
  onClick,
}: TeacherProps) {
  const ring = state === "speaking" || state === "listening" || state === "encouraging";
  const ringColor = state === "listening" ? "var(--color-success)" : "var(--color-primary)";
  const showBadge = badge ?? state === "encouraging";
  const glyph = glyphSize ?? Math.round(size * 0.41);
  const mouth = viseme !== undefined ? MOUTH[viseme] : null;
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
        <span style={mouth ? { transform: "translateY(-6%)" } : undefined}>ن</span>
        {mouth && (
          <span
            aria-hidden
            className="absolute left-1/2 bg-primary/70"
            style={{
              bottom: size * 0.17,
              width: size * mouth[0],
              height: size * mouth[1],
              borderRadius: size * mouth[2],
              transform: "translateX(-50%)",
              transition: "width 70ms linear, height 70ms linear, border-radius 70ms linear",
            }}
          />
        )}
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
