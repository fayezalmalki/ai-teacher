/**
 * Voice adapter contract. The session runtime talks only to this interface,
 * so the simulated adapter can be swapped for a realtime speech-to-speech
 * client (Gemini Live / OpenAI Realtime) without touching the UI.
 *
 * Teacher states Idle → Listening → Thinking → Speaking → Encouraging are
 * driven by the lesson engine; the adapter only reports when audio starts,
 * ends, or is interrupted (barge-in).
 */

export type VoiceAdapterKind = "simulated" | "gemini-live" | "openai-realtime";

export interface SpeakOptions {
  /** Abort playback (barge-in). */
  signal?: AbortSignal;
}

export interface ListenOptions {
  signal?: AbortSignal;
  /** Streaming partial transcript. */
  onPartial?: (text: string) => void;
  /** Hint the adapter may use to script an answer in simulation. */
  expectedKind?: string;
}

export interface ListenResult {
  transcript: string;
  /** True when the child interrupted the teacher mid-sentence. */
  bargedIn?: boolean;
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
