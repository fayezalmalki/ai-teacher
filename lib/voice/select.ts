"use client";

import type { Pace } from "@/lib/lesson-engine/timing";
import { CascadedVoiceAdapter } from "./cascaded";
import { SimulatedVoiceAdapter } from "./simulated";
import type { VoiceAdapter } from "./types";

export type VoiceMode = "simulated" | "cascaded";

/**
 * `?voice=` in the URL wins, then NEXT_PUBLIC_VOICE, then cascaded. Cascaded
 * degrades by itself (cached clips → /api/tts → device voice → timers), so it
 * is the safe default; `simulated` forces the silent timer-driven prototype.
 */
export function resolveVoiceMode(param: string | null | undefined): VoiceMode {
  const v = param || process.env.NEXT_PUBLIC_VOICE || "cascaded";
  return v === "simulated" ? "simulated" : "cascaded";
}

export function createVoiceAdapter(mode: VoiceMode, lessonId: string, pace: Pace, childName: string): VoiceAdapter {
  const simulated = new SimulatedVoiceAdapter(pace);
  if (mode === "cascaded") return new CascadedVoiceAdapter({ lessonId, fallback: simulated, childName });
  return simulated;
}
