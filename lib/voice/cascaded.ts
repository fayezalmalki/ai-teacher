"use client";

/**
 * Cascaded voice adapter: cached TTS clips for the teacher, push-to-talk +
 * speech-to-text + structured assessment for the child.
 *
 *  speak(text)  → look up the pre-rendered clip by line hash (manifest from
 *                 scripts/render-lines.ts), play it, emit viseme frames from
 *                 the audio clock, resolve on `ended`. Cache miss → /api/tts →
 *                 the device's Arabic voice (SpeechSynthesis) → the fallback
 *                 adapter's timing, so a lesson never stalls.
 *  listen()     → Web Speech API recognition when the browser has it, else
 *                 getUserMedia + MediaRecorder → POST /api/stt; then POST
 *                 /api/assess and resolve with the transcript and the
 *                 IntroAnswerKind the engine needs.
 *  interrupt()  → pause playback / stop recording (barge-in from the UI).
 */
import type { IntroAnswerKind } from "@/lib/lesson-engine/types";
import { hasBrowserRecognition, recognizeWithBrowser, speakWithBrowser, unlockBrowserSpeech } from "./browser";
import { hashLine, manifestPath, visemeAt, type LinesManifest, type ManifestLine } from "./lines";
import type { ListenOptions, ListenResult, SpeakOptions, VoiceAdapter, VisemeFrame } from "./types";

export interface CascadedOptions {
  lessonId: string;
  /** Adapter used when audio cannot be played or fetched (default: caller passes SilentVoiceAdapter). */
  fallback: VoiceAdapter;
  manifestUrl?: string;
  ttsEndpoint?: string;
  sttEndpoint?: string;
  assessEndpoint?: string;
  childName?: string;
  /** Stop recording after this much trailing silence (ms). */
  silenceMs?: number;
  /** Hard cap on one utterance (ms). */
  maxRecordMs?: number;
}

interface Clip {
  url: string;
  visemes: VisemeFrame[];
  durationMs: number;
  revoke?: () => void;
}

const VALID_KINDS: IntroAnswerKind[] = ["correct", "unclear", "dontknow", "strong"];

function aborted() {
  return new DOMException("Aborted", "AbortError");
}

export class CascadedVoiceAdapter implements VoiceAdapter {
  readonly kind = "cascaded" as const;
  private manifest: Promise<LinesManifest | null> | null = null;
  private clips = new Map<string, Clip>();
  private audio: HTMLAudioElement | null = null;
  private raf = 0;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private listenAbort: AbortController | null = null;
  private opts: Required<Omit<CascadedOptions, "childName">> & { childName: string };

  constructor(options: CascadedOptions) {
    this.opts = {
      manifestUrl: manifestPath(options.lessonId),
      ttsEndpoint: "/api/tts",
      sttEndpoint: "/api/stt",
      assessEndpoint: "/api/assess",
      silenceMs: 1200,
      maxRecordMs: 8000,
      childName: "",
      ...options,
    };
  }

  setChildName(name: string) {
    this.opts.childName = name;
  }

  /** Call from a user gesture: unlocks SpeechSynthesis / audio playback. */
  unlock() {
    unlockBrowserSpeech();
    this.unlocked = true;
  }
  private unlocked = false;

  async isAvailable() {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
  }

  /* ------------------------------------------------------------------ */
  /* speak                                                               */
  /* ------------------------------------------------------------------ */

  async speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    this.stopPlayback();
    if (opts.signal?.aborted) throw aborted();
    let clip: Clip | null = null;
    try {
      clip = await this.resolveClip(text);
    } catch (err) {
      console.warn("[voice] clip unavailable, falling back:", err);
    }
    if (opts.signal?.aborted) throw aborted();
    if (!clip) return this.speakWithDevice(text, opts);

    const audio = new Audio(clip.url);
    audio.preload = "auto";
    this.audio = audio;
    const frames = clip.visemes;
    const tick = () => {
      if (this.audio !== audio) return;
      opts.onViseme?.(visemeAt(frames, audio.currentTime * 1000));
      this.raf = requestAnimationFrame(tick);
    };

    try {
      await new Promise<void>((resolve, reject) => {
        const done = () => {
          cleanup();
          resolve();
        };
        const fail = (e: unknown) => {
          cleanup();
          reject(e);
        };
        const onAbort = () => {
          cleanup();
          reject(aborted());
        };
        const cleanup = () => {
          audio.removeEventListener("ended", done);
          audio.removeEventListener("error", fail);
          opts.signal?.removeEventListener("abort", onAbort);
          cancelAnimationFrame(this.raf);
          opts.onViseme?.(0);
          if (this.audio === audio) this.audio = null;
        };
        audio.addEventListener("ended", done);
        audio.addEventListener("error", fail);
        opts.signal?.addEventListener("abort", onAbort, { once: true });
        audio
          .play()
          .then(() => {
            this.raf = requestAnimationFrame(tick);
          })
          .catch(fail);
      });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
      // Autoplay policy or decode error: try the device voice, then simulated timing.
      console.warn("[voice] playback failed, falling back:", err);
      return this.speakWithDevice(text, opts);
    }
  }

  /** Device SpeechSynthesis (Arabic voice) with the simulated adapter as the last resort. */
  private async speakWithDevice(text: string, opts: SpeakOptions): Promise<void> {
    try {
      await speakWithBrowser(text, { signal: opts.signal, onViseme: opts.onViseme });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
      console.info("[voice] device voice unavailable, using simulated timing:", (err as Error).message);
      return this.opts.fallback.speak(text, opts);
    }
  }

  private loadManifest(): Promise<LinesManifest | null> {
    if (!this.manifest) {
      this.manifest = fetch(this.opts.manifestUrl, { cache: "force-cache" })
        .then((r) => (r.ok ? (r.json() as Promise<LinesManifest>) : null))
        .catch(() => null);
    }
    return this.manifest;
  }

  private async resolveClip(text: string): Promise<Clip | null> {
    const hash = hashLine(text);
    const cached = this.clips.get(hash);
    if (cached) return cached;

    const manifest = await this.loadManifest();
    const line: ManifestLine | undefined = manifest?.lines[hash];
    if (line) {
      const base = this.opts.manifestUrl.replace(/manifest\.json$/, "");
      const clip: Clip = { url: base + line.file, visemes: line.visemes, durationMs: line.durationMs };
      this.clips.set(hash, clip);
      return clip;
    }

    // Cache miss (e.g. a child name that was not pre-rendered): synthesize on demand.
    if (this.ttsUnavailable) return null;
    const res = await fetch(this.opts.ttsEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.status === 503) {
      this.ttsUnavailable = true; // no vendor configured: stop asking
      return null;
    }
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const json = (await res.json()) as { audio: string; mime: string; durationMs: number; visemes: VisemeFrame[] };
    const bytes = Uint8Array.from(atob(json.audio), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: json.mime }));
    const clip: Clip = { url, visemes: json.visemes, durationMs: json.durationMs, revoke: () => URL.revokeObjectURL(url) };
    this.clips.set(hash, clip);
    return clip;
  }

  private ttsUnavailable = false;
  private recognitionBroken = false;

  private stopPlayback() {
    cancelAnimationFrame(this.raf);
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* listen                                                              */
  /* ------------------------------------------------------------------ */

  async listen(opts: ListenOptions = {}): Promise<ListenResult> {
    this.stopRecording();
    const ctrl = new AbortController();
    this.listenAbort = ctrl;
    opts.signal?.addEventListener("abort", () => ctrl.abort(), { once: true });

    let transcript = "";
    let r: ListenResult | null = null;
    if (hasBrowserRecognition() && !this.recognitionBroken) {
      r = await recognizeWithBrowser({ signal: ctrl.signal, onPartial: opts.onPartial, onLevel: opts.onLevel });
      if (ctrl.signal.aborted) throw aborted();
      if (r.error === "stt-failed") {
        this.recognitionBroken = true; // engine missing or offline: use the server path from now on
        r = null;
      }
    }
    if (!r) {
      r = await this.recordAndTranscribe(ctrl.signal, opts.onLevel);
      if (ctrl.signal.aborted) throw aborted();
    }
    if (r.error) return r;
    transcript = r.transcript;
    opts.onPartial?.(transcript);
    return this.assess(transcript, opts, ctrl.signal);
  }

  /** Server STT path (MediaRecorder → /api/stt) for browsers without the Web Speech API. */
  private async recordAndTranscribe(signal: AbortSignal, onLevel?: (l: number) => void): Promise<ListenResult> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return { transcript: "", error: "mic-unavailable" };
    }
    if (signal.aborted) {
      stream.getTracks().forEach((t) => t.stop());
      throw aborted();
    }
    this.stream = stream;

    const blob = await this.record(stream, signal, onLevel);
    if (signal.aborted) throw aborted();
    if (!blob || blob.size === 0) return { transcript: "", error: "no-speech" };

    try {
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch(this.opts.sttEndpoint, { method: "POST", body: form, signal });
      if (!res.ok) throw new Error(`stt ${res.status}`);
      const transcript = ((await res.json()) as { transcript?: string }).transcript ?? "";
      return transcript.trim() ? { transcript } : { transcript: "", error: "no-speech" };
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
      return { transcript: "", error: "stt-failed" };
    }
  }

  private async assess(transcript: string, opts: ListenOptions, signal: AbortSignal): Promise<ListenResult> {
    if (!opts.context) return { transcript };
    try {
      const res = await fetch(this.opts.assessEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal,
        body: JSON.stringify({
          lessonId: this.opts.lessonId,
          transcript,
          teacherLine: opts.context.teacherLine,
          turnState: opts.context.turnState,
          childName: this.opts.childName,
        }),
      });
      if (!res.ok) throw new Error(`assess ${res.status}`);
      const json = (await res.json()) as { kind?: IntroAnswerKind };
      const kind = json.kind && VALID_KINDS.includes(json.kind) ? json.kind : undefined;
      return { transcript, kind };
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
      return { transcript, error: "assess-failed" };
    }
  }

  /** Record until trailing silence after speech, the max duration, or abort. */
  private record(stream: MediaStream, signal: AbortSignal, onLevel?: (l: number) => void): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      this.recorder = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let spoke = false;
      let lastLoud = performance.now();
      const started = performance.now();
      let raf = 0;

      const finish = (keep: boolean) => {
        cancelAnimationFrame(raf);
        signal.removeEventListener("abort", onAbort);
        ctx.close().catch(() => {});
        recorder.onstop = () => {
          this.stopStream();
          resolve(keep && spoke ? new Blob(chunks, { type: recorder.mimeType }) : null);
        };
        if (recorder.state !== "inactive") recorder.stop();
        else recorder.onstop?.(new Event("stop"));
        if (this.recorder === recorder) this.recorder = null;
      };
      const onAbort = () => finish(false);
      signal.addEventListener("abort", onAbort, { once: true });

      const poll = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const d = (buf[i] - 128) / 128;
          sum += d * d;
        }
        const rms = Math.sqrt(sum / buf.length);
        onLevel?.(Math.min(1, rms * 6));
        const now = performance.now();
        if (rms > 0.03) {
          spoke = true;
          lastLoud = now;
        }
        if ((spoke && now - lastLoud > this.opts.silenceMs) || now - started > this.opts.maxRecordMs) {
          finish(true);
          return;
        }
        raf = requestAnimationFrame(poll);
      };
      recorder.start(250);
      raf = requestAnimationFrame(poll);
    });
  }

  private stopRecording() {
    this.listenAbort?.abort();
    this.listenAbort = null;
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.recorder = null;
    this.stopStream();
  }

  private stopStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  interrupt() {
    this.stopPlayback();
    this.stopRecording();
    this.opts.fallback.interrupt();
  }

  dispose() {
    this.interrupt();
    for (const c of this.clips.values()) c.revoke?.();
    this.clips.clear();
    this.opts.fallback.dispose();
  }
}
