/**
 * Voice adapter contract. The session runtime talks only to this interface,
 * so the simulated adapter can be swapped for the cascaded pipeline
 * (cached TTS + STT + assessment) or a realtime speech-to-speech client
 * (Gemini Live / OpenAI Realtime) without touching the UI.
 *
 * Teacher states Idle → Listening → Thinking → Speaking → Encouraging are
 * driven by the lesson engine; the adapter only reports when audio starts,
 * ends, or is interrupted (barge-in), plus mouth-shape frames for the avatar.
 */
import type { IntroAnswerKind } from "@/lib/lesson-engine/types";
import type { TurnState } from "@/lib/lesson-engine/contract";

export type VoiceAdapterKind = "simulated" | "cascaded" | "gemini-live" | "openai-realtime";

/**
 * Grouped mouth shapes for a 2D character (a Rive `viseme` number input).
 * 0 rest · 1 open (a) · 2 round (u/o) · 3 wide (i) · 4 lips closed (b/m)
 * 5 lip-teeth (f) · 6 tongue-teeth (t/d/s/l/n/r) · 7 back (k/q/g/x/sh)
 */
export type Viseme = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface VisemeFrame {
  /** Milliseconds from the start of the clip. */
  t: number;
  v: Viseme;
}

export interface SpeakOptions {
  /** Abort playback (barge-in). */
  signal?: AbortSignal;
  /** Mouth-shape callback while the clip plays. */
  onViseme?: (v: Viseme) => void;
}

export interface ListenContext {
  /** The teacher line the child is answering. */
  teacherLine: string;
  turnState: TurnState;
}

export interface ListenOptions {
  signal?: AbortSignal;
  /** Streaming partial transcript. */
  onPartial?: (text: string) => void;
  /** Hint the adapter may use to script an answer in simulation. */
  expectedKind?: string;
  /** Needed by adapters that assess the answer (cascaded, realtime). */
  context?: ListenContext;
  /** Recording level 0–1, for the waveform. */
  onLevel?: (level: number) => void;
}

export type ListenError = "mic-unavailable" | "no-speech" | "stt-failed" | "assess-failed";

export interface ListenResult {
  transcript: string;
  /** Engine-ready classification of the answer when the adapter assessed it. */
  kind?: IntroAnswerKind;
  /** True when the child interrupted the teacher mid-sentence. */
  bargedIn?: boolean;
  error?: ListenError;
}

export interface VoiceAdapter {
  readonly kind: VoiceAdapterKind;
  /** Whether a microphone / realtime channel can be used. */
  isAvailable(): Promise<boolean>;
  /** Speak a teacher line. Resolves when playback ends (the TTS end event). */
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  /** Capture one child utterance. */
  listen(opts?: ListenOptions): Promise<ListenResult>;
  /** Stop any playback or capture in progress. */
  interrupt(): void;
  dispose(): void;
}
