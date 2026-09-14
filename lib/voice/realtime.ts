/**
 * Realtime speech-to-speech client stub (Gemini Live / OpenAI Realtime).
 *
 * TODO(voice): implement one of
 *  - Gemini Live: wss bidi stream, audio in (16 kHz PCM) / audio out (24 kHz),
 *    `serverContent.interrupted` for barge-in.
 *  - OpenAI Realtime: WebRTC or WebSocket, `input_audio_buffer.*` for capture,
 *    `response.audio.delta` for playback, `conversation.interrupted` for barge-in.
 *
 * The session runtime expects:
 *  - `speak(text)` to resolve exactly when playback ends (drives Speaking → Listening).
 *  - `listen()` to resolve with the final transcript (drives Listening → Thinking).
 *  - `interrupt()` to cut playback when the child starts talking (barge-in).
 *
 * Structured assessment must come back through the `ModelTurn` contract
 * (see lib/lesson-engine/contract.ts); the state machine still decides the step.
 */
import type { ListenOptions, ListenResult, SpeakOptions, VoiceAdapter, VoiceAdapterKind } from "./types";

export interface RealtimeConfig {
  provider: Exclude<VoiceAdapterKind, "simulated">;
  /** Route handler that mints a short-lived client token; never ship API keys to the browser. */
  tokenEndpoint: string;
  voice?: string;
  language?: string;
}

export class RealtimeVoiceAdapter implements VoiceAdapter {
  readonly kind: VoiceAdapterKind;

  constructor(private config: RealtimeConfig) {
    this.kind = config.provider;
  }

  async isAvailable() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
    // Not implemented yet: report unavailable so the UI falls back to the simulated adapter + choice buttons.
    return false;
  }

  async speak(_text: string, _opts?: SpeakOptions): Promise<void> {
    void _text;
    void _opts;
    throw new Error(`RealtimeVoiceAdapter(${this.config.provider}).speak is not implemented`);
  }

  async listen(_opts?: ListenOptions): Promise<ListenResult> {
    void _opts;
    throw new Error(`RealtimeVoiceAdapter(${this.config.provider}).listen is not implemented`);
  }

  interrupt() {}

  dispose() {}
}
