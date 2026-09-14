"use client";

/**
 * Gemini Live API client over a raw WebSocket (BidiGenerateContent).
 *
 * Wire format (camelCase JSON):
 *   → { setup: {...} }                         first message
 *   ← { setupComplete: {} }
 *   → { realtimeInput: { audio: { data, mimeType: "audio/pcm;rate=16000" } } }
 *   ← { serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: "audio/pcm;rate=24000", data } }] } } }
 *   ← { serverContent: { inputTranscription: { text } } } / { outputTranscription: { text } }
 *   ← { serverContent: { interrupted: true } }   child spoke over the model → flush playback
 *   ← { serverContent: { turnComplete: true } }
 *   ← { goAway: { timeLeft } }                   server will close soon
 *
 * Auth is an ephemeral token minted by /api/live/token and passed as
 * `access_token`; the API key never reaches the browser.
 */
import { PcmPlayer, startCapture, toBase64, fromBase64, type Capture } from "./audio";
import type { LiveEvents, LiveLimits, LiveSession, LiveStatus } from "./types";

interface ServerMessage {
  setupComplete?: unknown;
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { mimeType?: string; data?: string }; text?: string }[] };
    turnComplete?: boolean;
    interrupted?: boolean;
    generationComplete?: boolean;
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
  toolCall?: unknown;
  goAway?: { timeLeft?: string };
  error?: { message?: string };
}

export interface GeminiLiveOptions {
  wsUrl: string;
  token: string;
  setup: Record<string, unknown>;
  /** Text the client sends first so the teacher opens the conversation. */
  kickoff?: string;
  limits: LiveLimits;
}

export class GeminiLiveSession implements LiveSession {
  readonly kind = "gemini-live" as const;
  private ws: WebSocket | null = null;
  private capture: Capture | null = null;
  private player: PcmPlayer | null = null;
  private events: LiveEvents = {};
  private status: LiveStatus = "connecting";
  private startedAt = 0;
  private turns = 0;
  private question = "";
  private answer = "";
  private modelSpoke = false;
  private timeTimer: ReturnType<typeof setTimeout> | null = null;
  private closing = false;

  constructor(private opts: GeminiLiveOptions) {}

  async start(events: LiveEvents): Promise<void> {
    this.events = events;
    this.setStatus("connecting");
    this.player = new PcmPlayer((v) => events.onViseme?.(v));
    await this.player.resume();

    await new Promise<void>((resolve, reject) => {
      const url = `${this.opts.wsUrl}?access_token=${encodeURIComponent(this.opts.token)}`;
      const ws = new WebSocket(url);
      this.ws = ws;
      let ready = false;
      ws.onopen = () => ws.send(JSON.stringify({ setup: this.opts.setup }));
      ws.onmessage = async (e) => {
        const raw = typeof e.data === "string" ? e.data : await (e.data as Blob).text();
        let msg: ServerMessage;
        try {
          msg = JSON.parse(raw) as ServerMessage;
        } catch {
          return;
        }
        if (!ready && msg.setupComplete !== undefined) {
          ready = true;
          resolve();
          return;
        }
        this.handle(msg);
      };
      ws.onerror = () => {
        if (!ready) reject(new Error("WebSocket error"));
        else this.fail("انقطع الاتصال بالمعلم.");
      };
      ws.onclose = (ev) => {
        if (!ready) reject(new Error(`WebSocket closed (${ev.code}) ${ev.reason}`));
        else if (!this.closing) this.fail(ev.reason ? `انتهت المحادثة: ${ev.reason}` : "انتهت المحادثة.");
      };
    });

    this.startedAt = Date.now();
    this.timeTimer = setTimeout(() => {
      this.events.onLimit?.("time");
      this.close();
    }, this.opts.limits.maxDurationMs);

    if (this.opts.kickoff) {
      this.send({ clientContent: { turns: [{ role: "user", parts: [{ text: this.opts.kickoff }] }], turnComplete: true } });
    }

    this.capture = await startCapture(
      (pcm) => this.send({ realtimeInput: { audio: { data: toBase64(pcm), mimeType: "audio/pcm;rate=16000" } } }),
      (level) => this.events.onLevel?.(level),
    );
    this.setStatus("listening");
  }

  remainingMs(): number {
    if (!this.startedAt) return this.opts.limits.maxDurationMs;
    return Math.max(0, this.opts.limits.maxDurationMs - (Date.now() - this.startedAt));
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    if (this.timeTimer) clearTimeout(this.timeTimer);
    this.flushTurn();
    this.capture?.stop();
    this.capture = null;
    try {
      this.send({ realtimeInput: { audioStreamEnd: true } });
    } catch {
      /* socket may be gone */
    }
    this.ws?.close(1000, "done");
    this.ws = null;
    this.player?.close();
    this.player = null;
    this.setStatus("closed");
  }

  private handle(msg: ServerMessage) {
    if (msg.error?.message) {
      this.fail(msg.error.message);
      return;
    }
    if (msg.goAway) {
      this.events.onLimit?.("time");
      this.close();
      return;
    }
    const sc = msg.serverContent;
    if (!sc) return;
    if (sc.interrupted) {
      this.player?.flush();
      this.setStatus("listening");
      return;
    }
    if (sc.inputTranscription?.text) {
      this.question += sc.inputTranscription.text;
      this.events.onInputTranscript?.(this.question, false);
    }
    if (sc.outputTranscription?.text) {
      this.answer += sc.outputTranscription.text;
      this.events.onOutputTranscript?.(this.answer);
    }
    const parts = sc.modelTurn?.parts ?? [];
    for (const p of parts) {
      const data = p.inlineData?.data;
      if (data && (p.inlineData?.mimeType ?? "").startsWith("audio/pcm")) {
        this.modelSpoke = true;
        this.setStatus("speaking");
        this.player?.enqueue(fromBase64(data));
      }
    }
    if (sc.turnComplete) {
      // Wait for queued audio to finish before flipping back to listening.
      const wait = this.player?.isPlaying() ? 250 : 0;
      const check = () => {
        if (this.player?.isPlaying()) {
          setTimeout(check, 150);
          return;
        }
        this.flushTurn();
        if (!this.closing) this.setStatus("listening");
      };
      setTimeout(check, wait);
    }
  }

  /** Record the finished exchange and enforce the turn cap. */
  private flushTurn() {
    if (!this.modelSpoke && !this.question && !this.answer) return;
    if (this.question) this.events.onInputTranscript?.(this.question, true);
    this.events.onTurn?.(this.question, this.answer);
    this.question = "";
    this.answer = "";
    this.modelSpoke = false;
    this.turns += 1;
    if (this.turns > this.opts.limits.maxTurns && !this.closing) {
      this.events.onLimit?.("turns");
      this.close();
    }
  }

  private send(payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  private setStatus(s: LiveStatus) {
    if (this.status === s) return;
    this.status = s;
    this.events.onStatus?.(s);
  }

  private fail(message: string) {
    this.events.onError?.(message);
    this.closing = true;
    this.capture?.stop();
    this.capture = null;
    this.player?.close();
    this.player = null;
    this.setStatus("error");
  }
}
