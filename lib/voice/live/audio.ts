"use client";

/**
 * Browser audio plumbing for live sessions: 16 kHz PCM16 capture through an
 * AudioWorklet, and gapless playback of 24 kHz PCM16 chunks with a viseme
 * estimate from each chunk's loudness.
 */
import type { Viseme } from "../types";

const CAPTURE_RATE = 16000;
const PLAYBACK_RATE = 24000;

/** Runs inside the AudioWorklet: downsample to 16 kHz, emit Int16 blocks of ~100 ms. */
const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${CAPTURE_RATE};
    this.buf = [];
    this.acc = 0;
    this.blockSize = ${CAPTURE_RATE / 10};
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    const rms = Math.sqrt(sum / ch.length);
    // decimate (nearest sample) to 16 kHz
    for (let i = 0; i < ch.length; i++) {
      this.acc += 1;
      if (this.acc >= this.ratio) {
        this.acc -= this.ratio;
        const s = Math.max(-1, Math.min(1, ch[i]));
        this.buf.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
    }
    if (this.buf.length >= this.blockSize) {
      const out = new Int16Array(this.buf.splice(0, this.blockSize));
      this.port.postMessage({ pcm: out.buffer, rms }, [out.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

export interface Capture {
  stop(): void;
}

/** Start capturing the mic as 16 kHz PCM16 blocks. */
export async function startCapture(
  onChunk: (pcm: ArrayBuffer) => void,
  onLevel?: (level: number) => void,
): Promise<Capture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const ctx = new AudioContext({ sampleRate: CAPTURE_RATE });
  const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
  try {
    await ctx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm-capture");
  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
    onChunk(e.data.pcm);
    onLevel?.(Math.min(1, e.data.rms * 6));
  };
  source.connect(node);
  // Keep the graph alive without routing the mic to the speakers.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  node.connect(sink).connect(ctx.destination);
  if (ctx.state === "suspended") await ctx.resume();
  return {
    stop() {
      node.port.onmessage = null;
      node.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    },
  };
}

export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
}

export function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Loudness → a coarse mouth shape when no timestamps exist. */
export function visemeFromRms(rms: number): Viseme {
  if (rms < 0.02) return 0;
  if (rms < 0.06) return 6;
  if (rms < 0.12) return 3;
  return 1;
}

/** Gapless scheduler for 24 kHz PCM16 chunks with per-chunk viseme callbacks. */
export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  private sources: AudioBufferSourceNode[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(private onViseme?: (v: Viseme) => void) {}

  private context(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext({ sampleRate: PLAYBACK_RATE });
    return this.ctx;
  }

  async resume() {
    const ctx = this.context();
    if (ctx.state === "suspended") await ctx.resume();
  }

  /** Queue a chunk; returns the time (ms from now) at which it finishes. */
  enqueue(pcm: ArrayBuffer): number {
    const ctx = this.context();
    const int16 = new Int16Array(pcm);
    const buffer = ctx.createBuffer(1, int16.length, PLAYBACK_RATE);
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < int16.length; i++) {
      const s = int16[i] / 32768;
      data[i] = s;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / Math.max(1, int16.length));
    const now = ctx.currentTime;
    const start = Math.max(now + 0.04, this.nextTime);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(start);
    source.onended = () => {
      this.sources = this.sources.filter((s) => s !== source);
    };
    this.sources.push(source);
    this.nextTime = start + buffer.duration;
    if (this.onViseme) {
      const v = visemeFromRms(rms);
      const t = setTimeout(() => this.onViseme?.(v), Math.max(0, (start - now) * 1000));
      this.timers.push(t);
      const rest = setTimeout(() => {
        if (this.ctx && this.ctx.currentTime >= this.nextTime - 0.01) this.onViseme?.(0);
      }, Math.max(0, (this.nextTime - now) * 1000) + 30);
      this.timers.push(rest);
    }
    return (this.nextTime - now) * 1000;
  }

  /** True while queued audio is still playing. */
  isPlaying(): boolean {
    return !!this.ctx && this.ctx.currentTime < this.nextTime - 0.02;
  }

  /** Drop everything queued (barge-in). */
  flush() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.nextTime = 0;
    this.onViseme?.(0);
  }

  close() {
    this.flush();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
