"use client";

import type { Pace } from "@/lib/lesson-engine/timing";
import type { SoundMode } from "@/lib/store/state";
import { CascadedVoiceAdapter } from "./cascaded";
import { SilentVoiceAdapter } from "./silent";
import type { VoiceAdapter } from "./types";

/**
 * cascaded  – spoken lesson: cached clips → /api/tts → device voice → timers.
 * reading   – no sound; the child taps to advance and taps an answer.
 * simulated – no sound, timer-driven (tests and the offline prototype).
 */
export type VoiceMode = "cascaded" | "reading" | "simulated";

/**
 * `?voice=` in the URL wins, then the child's sound setting, then
 * NEXT_PUBLIC_VOICE, then cascaded.
 */
export function resolveVoiceMode(param: string | null | undefined, sound?: SoundMode): VoiceMode {
  if (param === "reading" || param === "silent") return "reading";
  if (param === "simulated") return "simulated";
  if (param === "cascaded") return "cascaded";
  if (sound === "reading") return "reading";
  const env = process.env.NEXT_PUBLIC_VOICE;
  return env === "simulated" ? "simulated" : env === "reading" ? "reading" : "cascaded";
}

export function createVoiceAdapter(mode: VoiceMode, lessonId: string, pace: Pace, childName: string): VoiceAdapter {
  if (mode === "reading") return new SilentVoiceAdapter({ pace, manual: true });
  const silent = new SilentVoiceAdapter({ pace });
  if (mode === "cascaded") return new CascadedVoiceAdapter({ lessonId, fallback: silent, childName });
  return silent;
}

/** Reading-mode adapters expose advance(); anything else returns null. */
export function asReadable(voice: VoiceAdapter): SilentVoiceAdapter | null {
  return voice instanceof SilentVoiceAdapter && voice.manual ? voice : null;
}
