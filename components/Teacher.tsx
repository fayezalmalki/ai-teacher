"use client";

import Character from "@/components/character/Character";
import Waveform from "@/components/Waveform";
import { resolveCharacterMode, type CharacterMode, type TeacherState } from "@/lib/character/contract";
import type { Viseme } from "@/lib/voice/types";

export type { TeacherState };

interface TeacherProps {
  size?: number;
  state?: TeacherState;
  /** Kept for call-site compatibility (glyph mode font size). */
  glyphSize?: number;
  /** Yellow ★ badge (end screen). */
  badge?: boolean;
  badgeSize?: number;
  viseme?: Viseme;
  level?: number;
  character?: CharacterMode;
  /** Slow idle wobble (start / intro screens). */
  idleWobble?: boolean;
  /** Dashed ring even when idle (lesson intro). */
  ring?: boolean;
  /** Landing hero: 10px tinted offset shadow. */
  hero?: boolean;
  onClick?: () => void;
}

/**
 * v2 avatar: wobbly ink circle, white fill, flat blue shadow. State shows
 * through motion only: dashed ring + wobble while speaking, nod on praise,
 * a small green wave badge while listening. The face is the character rig.
 */
export default function Teacher({
  size = 120,
  state = "idle",
  glyphSize,
  badge,
  badgeSize = 42,
  viseme = 0,
  level = 0,
  character,
  idleWobble,
  ring,
  hero,
  onClick,
}: TeacherProps) {
  const mode = character ?? resolveCharacterMode();
  const speaking = state === "speaking";
  const encouraging = state === "encouraging";
  const listening = state === "listening";
  const showRing = ring || speaking || encouraging;
  const animation = encouraging
    ? "nod 1.2s ease-in-out infinite"
    : speaking
      ? "wobble 2.4s ease-in-out infinite"
      : idleWobble
        ? "wobble 6s ease-in-out infinite"
        : "none";
  const shadow = hero
    ? "10px 10px 0 var(--color-primary-tint)"
    : size >= 140
      ? "6px 6px 0 var(--color-primary-tint)"
      : "5px 5px 0 var(--color-primary-tint)";
  return (
    <div className="relative select-none" style={{ width: size, height: size }} onClick={onClick}>
      {showRing && (
        <span
          key={state}
          className="absolute rounded-full border-2 border-dashed border-primary motion"
          style={{ inset: -8, animation: "ring 1.6s ease-out infinite" }}
        />
      )}
      <div
        className="absolute inset-0 r-avatar ink bg-surface overflow-hidden grid place-items-center motion"
        style={{ boxShadow: shadow, animation }}
      >
        <div className="w-full h-full">
          <Character mode={mode} size={size - 6} state={state} viseme={viseme} level={level} glyphSize={glyphSize} />
        </div>
      </div>
      {listening && (
        <div className="absolute -bottom-1.5 -left-1.5 h-8 px-2.5 r-square ink-2 bg-surface flex items-center motion animate-pop-in-fast">
          <Waveform active height={16} />
        </div>
      )}
      {badge && (
        <div
          className="absolute -bottom-1.5 -left-1.5 rounded-full ink bg-yellow grid place-items-center font-bold motion animate-pop-in"
          style={{ width: badgeSize, height: badgeSize, fontSize: Math.round(badgeSize / 2), animationDelay: ".3s" }}
        >
          ★
        </div>
      )}
    </div>
  );
}
