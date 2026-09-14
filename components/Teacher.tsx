"use client";

import Character from "@/components/character/Character";
import { resolveCharacterMode, type CharacterMode, type TeacherState } from "@/lib/character/contract";
import type { Viseme } from "@/lib/voice/types";

export type { TeacherState };

interface TeacherProps {
  size?: number;
  state?: TeacherState;
  /** Border width of the inner circle. */
  border?: number;
  /** Ring offset (negative inset) in px. */
  ringInset?: number;
  ringDuration?: string;
  /** Font size for the typographic character. */
  glyphSize?: number;
  badgeSize?: number;
  /** Force the ✓ badge regardless of state. */
  badge?: boolean;
  /** Mouth shape from the voice adapter (0 = rest). */
  viseme?: Viseme;
  /** Mic level 0–1 while listening. */
  level?: number;
  /** Renderer: typographic glyph, the SVG rig, or the Rive file. Defaults to NEXT_PUBLIC_CHARACTER or the SVG rig. */
  character?: CharacterMode;
  onClick?: () => void;
}

/**
 * The teacher character in its circle. Ring animates while speaking or
 * listening; a green ✓ badge appears while encouraging. The face itself is
 * rendered by components/character (glyph, SVG rig, or Rive) and driven by
 * the same five states and viseme input.
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
  viseme = 0,
  level = 0,
  character,
  onClick,
}: TeacherProps) {
  const mode = character ?? resolveCharacterMode();
  const ring = state === "speaking" || state === "listening" || state === "encouraging";
  const ringColor = state === "listening" ? "var(--color-success)" : "var(--color-primary)";
  const showBadge = badge ?? state === "encouraging";
  const inner = size - border * 2;
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
        className="absolute inset-0 rounded-full bg-primary-tint overflow-hidden grid place-items-center transition-transform duration-300"
        style={{ border: `${border}px solid var(--color-primary-tint-2)` }}
      >
        <div className="w-full h-full">
          <Character mode={mode} size={inner} state={state} viseme={viseme} level={level} glyphSize={glyphSize} />
        </div>
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
