"use client";

/**
 * Browser-native speech: SpeechSynthesis for the teacher and the Web Speech
 * API (SpeechRecognition) for the child. No keys, no uploads; quality depends
 * on the device's Arabic voice and on Chrome/Safari recognition support.
 * The cascaded adapter uses these when no vendor is configured.
 */
import { speakDuration } from "@/lib/lesson-engine/timing";
import { estimateAlignment, visemeAt, visemesFromAlignment } from "./lines";
import type { ListenResult, Viseme } from "./types";

type RecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function hasBrowserSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function hasBrowserRecognition(): boolean {
  return recognitionCtor() !== null;
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
/** Voices load asynchronously in Chrome; wait for them once. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!hasBrowserSynthesis()) return Promise.resolve([]);
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const have = synth.getVoices();
      if (have.length) return resolve(have);
      const t = setTimeout(() => resolve(synth.getVoices()), 1500);
      synth.addEventListener(
        "voiceschanged",
        () => {
          clearTimeout(t);
          resolve(synth.getVoices());
        },
        { once: true },
      );
    });
  }
  return voicesReady;
}

/** Prefer a Saudi voice, then any Arabic voice; null when the device has none. */
export function pickArabicVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ar = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("ar"));
  if (!ar.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    let s = 0;
    if (lang === "ar-sa") s += 4;
    if (/google|microsoft|premium|enhanced|neural/i.test(v.name)) s += 2;
    if (v.localService) s += 1;
    if (v.default) s += 1;
    return s;
  };
  return ar.sort((a, b) => score(b) - score(a))[0];
}

/** Call from a user gesture so later speak() calls are allowed. */
export function unlockBrowserSpeech() {
  if (!hasBrowserSynthesis()) return;
  void loadVoices();
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export class NoArabicVoiceError extends Error {}

/**
 * Speak with the device voice. Resolves on `end`; rejects on abort, on
 * `not-allowed` (no user activation yet), or when there is no Arabic voice.
 * Mouth shapes are estimated over the expected duration and advanced by word
 * boundaries when the voice reports them.
 */
export async function speakWithBrowser(
  text: string,
  opts: { signal?: AbortSignal; onViseme?: (v: Viseme) => void; rate?: number } = {},
): Promise<void> {
  if (!hasBrowserSynthesis()) throw new NoArabicVoiceError("speechSynthesis unavailable");
  const voice = pickArabicVoice(await loadVoices());
  if (!voice) throw new NoArabicVoiceError("no Arabic voice on this device");
  if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const synth = window.speechSynthesis;
  const rate = opts.rate ?? 0.95;
  const expectedMs = Math.round((speakDuration(text) * 1.15) / rate);
  const frames = visemesFromAlignment(estimateAlignment(text, expectedMs), expectedMs);

  return new Promise<void>((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.pitch = 1;
    let started = 0;
    let raf = 0;
    let boundaryOffset = 0; // ms adjustment from boundary events
    const tick = () => {
      const t = performance.now() - started + boundaryOffset;
      opts.onViseme?.(visemeAt(frames, Math.min(t, expectedMs - 1)));
      raf = requestAnimationFrame(tick);
    };
    const finish = (err?: Error) => {
      cancelAnimationFrame(raf);
      opts.onViseme?.(0);
      opts.signal?.removeEventListener("abort", onAbort);
      if (err) reject(err);
      else resolve();
    };
    const onAbort = () => {
      synth.cancel();
      finish(new DOMException("Aborted", "AbortError"));
    };
    u.onstart = () => {
      started = performance.now();
      raf = requestAnimationFrame(tick);
    };
    u.onboundary = (e) => {
      // Re-anchor the estimated track to the real position in the text.
      if (typeof e.charIndex === "number" && text.length) {
        const ideal = (e.charIndex / text.length) * expectedMs;
        boundaryOffset = ideal - (performance.now() - started);
      }
    };
    u.onend = () => finish();
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") finish(new DOMException("Aborted", "AbortError"));
      else finish(new Error(`speechSynthesis ${e.error}`));
    };
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    // Chrome pauses the queue if something was left in it.
    synth.cancel();
    synth.speak(u);
    // Safari never fires onstart when the tab is muted/backgrounded; guard with a timeout.
    setTimeout(() => {
      if (!started && !synth.speaking && !synth.pending) finish(new Error("speechSynthesis did not start"));
    }, 2500);
  });
}

/**
 * Recognize one utterance in Arabic with the Web Speech API. Resolves with the
 * transcript (empty + `no-speech` when nothing was heard). A mic level is
 * sampled separately through an AnalyserNode when the mic can be opened.
 */
export function recognizeWithBrowser(opts: {
  signal?: AbortSignal;
  onPartial?: (text: string) => void;
  onLevel?: (level: number) => void;
  lang?: string;
  /** Give up if recognition has not started by then (engine missing / offline). */
  startTimeoutMs?: number;
  /** Hard cap on one utterance. */
  maxMs?: number;
}): Promise<ListenResult> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.resolve({ transcript: "", error: "stt-failed" });
  return new Promise((resolve) => {
    const rec = new Ctor();
    rec.lang = opts.lang ?? "ar-SA";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    let interim = "";
    let done = false;
    let started = false;
    let stopLevel: (() => void) | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = (result: ListenResult) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      stopLevel?.();
      opts.signal?.removeEventListener("abort", onAbort);
      resolve(result);
    };
    timers.push(
      setTimeout(() => {
        if (!started) {
          try {
            rec.abort();
          } catch {
            /* ignore */
          }
          finish({ transcript: "", error: "stt-failed" });
        }
      }, opts.startTimeoutMs ?? 3000),
    );
    timers.push(
      setTimeout(() => {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        timers.push(setTimeout(() => finish({ transcript: (finalText || interim).trim(), error: finalText || interim ? undefined : "no-speech" }), 1500));
      }, opts.maxMs ?? 12000),
    );
    const onAbort = () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      finish({ transcript: "", error: "no-speech" });
    };
    opts.signal?.addEventListener("abort", onAbort, { once: true });

    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      opts.onPartial?.((finalText + " " + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") finish({ transcript: "", error: "mic-unavailable" });
      else if (e.error === "no-speech") finish({ transcript: "", error: "no-speech" });
      else if (e.error === "aborted") finish({ transcript: finalText.trim(), error: finalText ? undefined : "no-speech" });
      else finish({ transcript: finalText.trim(), error: finalText ? undefined : "stt-failed" });
    };
    rec.onend = () => {
      const t = (finalText || interim).trim();
      finish(t ? { transcript: t } : { transcript: "", error: "no-speech" });
    };
    rec.onstart = () => {
      started = true;
      if (opts.onLevel) stopLevel = sampleLevel(opts.onLevel);
    };
    rec.onaudiostart = () => {
      started = true;
    };
    try {
      rec.start();
    } catch (err) {
      finish({ transcript: "", error: "stt-failed" });
      void err;
    }
  });
}

/** Open the mic for a level meter only; returns a stop function. Fails silently. */
function sampleLevel(onLevel: (l: number) => void): () => void {
  let stopped = false;
  let cleanup = () => {};
  navigator.mediaDevices
    ?.getUserMedia({ audio: true })
    .then((stream) => {
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let raf = 0;
      const poll = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const d = (buf[i] - 128) / 128;
          sum += d * d;
        }
        onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 6));
        raf = requestAnimationFrame(poll);
      };
      raf = requestAnimationFrame(poll);
      cleanup = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        onLevel(0);
      };
    })
    .catch(() => {});
  return () => {
    stopped = true;
    cleanup();
  };
}
