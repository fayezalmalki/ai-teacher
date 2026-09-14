/**
 * Character input contract shared by every renderer of الأستاذ نواف:
 * the code-drawn SVG rig, the Rive runtime binding, and the designer's
 * .riv file. Keep the names and numbers here in sync with docs/character-rig.md.
 */
import type { Viseme } from "@/lib/voice/types";

export type TeacherState = "idle" | "listening" | "thinking" | "speaking" | "encouraging";

export type CharacterMode = "glyph" | "svg" | "rive";

/** Rive file, artboard and state machine the runtime binds to. */
export const RIVE_FILE = "/characters/nawaf.riv";
export const RIVE_ARTBOARD = "Nawaf";
export const RIVE_STATE_MACHINE = "Teacher";

/** State machine inputs. */
export const INPUT_STATE = "state"; // Number 0–4, see STATE_INDEX
export const INPUT_VISEME = "viseme"; // Number 0–7, see lib/voice/types.ts Viseme
export const INPUT_LEVEL = "level"; // Number 0–1, mic level while listening
export const INPUT_BLINK = "blink"; // Trigger (optional; rig may auto-blink)

export const STATE_INDEX: Record<TeacherState, number> = {
  idle: 0,
  listening: 1,
  thinking: 2,
  speaking: 3,
  encouraging: 4,
};

export const STATES: TeacherState[] = ["idle", "listening", "thinking", "speaking", "encouraging"];

export const VISEMES: Viseme[] = [0, 1, 2, 3, 4, 5, 6, 7];

export const VISEME_LABELS: Record<Viseme, string> = {
  0: "rest",
  1: "open (a)",
  2: "round (u/o)",
  3: "wide (i)",
  4: "lips closed (b/m)",
  5: "lip-teeth (f)",
  6: "tongue-teeth (t/d/s/l/n/r)",
  7: "back (k/q/g/x/sh)",
};

/** `?character=` wins, then NEXT_PUBLIC_CHARACTER, then the SVG rig. */
export function resolveCharacterMode(param?: string | null): CharacterMode {
  const v = param || process.env.NEXT_PUBLIC_CHARACTER || "svg";
  return v === "glyph" || v === "rive" ? v : "svg";
}

/** Clamp any number into the viseme range. */
export function toViseme(n: number): Viseme {
  const i = Math.max(0, Math.min(7, Math.round(n)));
  return i as Viseme;
}
