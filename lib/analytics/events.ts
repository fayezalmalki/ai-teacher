/**
 * Analytics events. For the MVP they are buffered in memory and logged in
 * development; wire `sink` to PostHog / Supabase when ready.
 */
export type AnalyticsEvent =
  | { name: "session_started"; lessonId: string; childName: string }
  | { name: "step_entered"; lessonId: string; step: string; difficulty: number; strategy: string }
  | { name: "answer"; lessonId: string; step: string; correct: boolean; transcript: string }
  | { name: "adaptation"; lessonId: string; text: string }
  | { name: "session_ended"; lessonId: string; questions: number; correct: number; reexplain: number }
  | { name: "screen"; path: string }
  | { name: "onboarded" };

type Sink = (event: AnalyticsEvent & { ts: number }) => void;

const buffer: (AnalyticsEvent & { ts: number })[] = [];
let sink: Sink | null = null;

export function setAnalyticsSink(fn: Sink | null) {
  sink = fn;
}

export function track(event: AnalyticsEvent) {
  const e = { ...event, ts: Date.now() };
  buffer.push(e);
  if (buffer.length > 500) buffer.shift();
  if (sink) sink(e);
  else if (process.env.NODE_ENV === "development" && typeof console !== "undefined") {
    console.debug("[analytics]", e.name, e);
  }
}

export function getBufferedEvents() {
  return [...buffer];
}
