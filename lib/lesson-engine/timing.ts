/**
 * Interaction timings from the design handoff. All values are milliseconds.
 * The "fast" pace multiplies every timing by 0.45.
 */
export type Pace = "demo" | "fast";

export const PACE_FACTOR: Record<Pace, number> = { demo: 1, fast: 0.45 };

/** Session: speaking = max(1800ms, 55ms × chars). Replace with the real TTS end event. */
export function speakDuration(text: string): number {
  return Math.max(1800, text.length * 55);
}

/** Explanation mode: speaking = max(2200ms, 60ms × chars). */
export function explainSpeakDuration(text: string): number {
  return Math.max(2200, text.length * 60);
}

/** Pause before auto-advancing to the next step. */
export const PAUSE_MS = 500;
/** "أفهم إجابتك…" thinking time. */
export const THINK_MS = 1600;
/** Simulated mic recording length. */
export const RECORD_MS = 1800;
/** Toast visibility. */
export const TOAST_MS = 2200;
/** Delay after the fourth PIN digit before auto-advancing. */
export const PIN_ADVANCE_MS = 300;

export function scaled(ms: number, pace: Pace): number {
  return Math.round(ms * PACE_FACTOR[pace]);
}
