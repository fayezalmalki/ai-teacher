/**
 * Full-duplex live conversation ("ask the teacher"). Unlike VoiceAdapter's
 * speak/listen turns, a live session streams mic audio continuously and
 * plays model audio as it arrives, with server-side turn detection and
 * barge-in. The lesson engine holds the step; this is a bounded detour.
 */
import type { Viseme } from "../types";

export type LiveStatus = "connecting" | "listening" | "speaking" | "closed" | "error";

export interface LiveEvents {
  onStatus?: (status: LiveStatus) => void;
  /** Child's speech transcript; `final` when the turn ended. */
  onInputTranscript?: (text: string, final: boolean) => void;
  /** Teacher's speech transcript, accumulated for the current turn. */
  onOutputTranscript?: (text: string) => void;
  /** One completed exchange. */
  onTurn?: (question: string, answer: string) => void;
  onViseme?: (v: Viseme) => void;
  /** Mic level 0–1. */
  onLevel?: (level: number) => void;
  /** Time or turn cap reached; the session closes after the current turn. */
  onLimit?: (reason: "time" | "turns") => void;
  onError?: (message: string) => void;
}

export interface LiveLimits {
  maxDurationMs: number;
  maxTurns: number;
}

export interface LiveSession {
  readonly kind: "gemini-live" | "mock";
  /** Open the connection and the microphone. Resolves once the model can hear. */
  start(events: LiveEvents): Promise<void>;
  /** Milliseconds remaining before the time cap. */
  remainingMs(): number;
  /** End the conversation and release the microphone. */
  close(): void;
}

/** What /api/live/token returns. */
export interface LiveTokenResponse {
  provider: "gemini-live" | "mock" | "off";
  /** Ephemeral token (gemini-live). */
  token?: string;
  /** WebSocket URL without credentials (gemini-live). */
  wsUrl?: string;
  /** Setup message the client sends first (gemini-live). */
  setup?: Record<string, unknown>;
  /** Canned exchanges for the mock. */
  script?: { greeting: string; question: string; answer: string };
  limits: LiveLimits;
  reason?: string;
}
