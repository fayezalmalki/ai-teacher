"use client";

/**
 * Offline stand-in for the Gemini Live session so the "ask the teacher"
 * screen can be developed and tested without a key or a microphone. Speaks a
 * canned greeting, "hears" a canned question after a moment, answers it, and
 * respects the same limits.
 */
import { estimateAlignment, visemesFromAlignment } from "../lines";
import { speakDuration } from "@/lib/lesson-engine/timing";
import type { LiveEvents, LiveLimits, LiveSession } from "./types";

export interface MockLiveOptions {
  script: { greeting: string; question: string; answer: string };
  limits: LiveLimits;
  /** Multiply all timings (tests). */
  pace?: number;
}

export class MockLiveSession implements LiveSession {
  readonly kind = "mock" as const;
  private events: LiveEvents = {};
  private timers: ReturnType<typeof setTimeout>[] = [];
  private raf = 0;
  private startedAt = 0;
  private turns = 0;
  private closed = false;

  constructor(private opts: MockLiveOptions) {}

  private after(ms: number, fn: () => void) {
    const t = setTimeout(() => !this.closed && fn(), ms * (this.opts.pace ?? 1));
    this.timers.push(t);
  }

  private speak(text: string, then: () => void) {
    const duration = speakDuration(text);
    const frames = visemesFromAlignment(estimateAlignment(text, duration), duration);
    this.events.onStatus?.("speaking");
    const start = performance.now();
    let i = 0;
    const tick = () => {
      if (this.closed) return;
      const t = (performance.now() - start) / (this.opts.pace ?? 1);
      while (i < frames.length && frames[i].t <= t) {
        this.events.onViseme?.(frames[i].v);
        i++;
      }
      const shown = Math.min(text.length, Math.round((t / duration) * text.length));
      this.events.onOutputTranscript?.(text.slice(0, shown));
      if (t < duration) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    this.after(duration, () => {
      cancelAnimationFrame(this.raf);
      this.events.onViseme?.(0);
      this.events.onOutputTranscript?.(text);
      then();
    });
  }

  async start(events: LiveEvents): Promise<void> {
    this.events = events;
    events.onStatus?.("connecting");
    await new Promise((r) => this.after(400, () => r(null)));
    this.startedAt = Date.now();
    this.after(this.opts.limits.maxDurationMs, () => {
      events.onLimit?.("time");
      this.close();
    });
    this.speak(this.opts.script.greeting, () => this.listenOnce());
  }

  private listenOnce() {
    this.events.onStatus?.("listening");
    let level = 0;
    const pulse = () => {
      if (this.closed) return;
      level = 0.2 + Math.random() * 0.5;
      this.events.onLevel?.(level);
      this.after(120, pulse);
    };
    this.after(800, pulse);
    this.after(2600, () => {
      const q = this.opts.script.question;
      this.events.onInputTranscript?.(q, true);
      this.events.onLevel?.(0);
      this.speak(this.opts.script.answer, () => {
        this.events.onTurn?.(q, this.opts.script.answer);
        this.turns += 1;
        if (this.turns >= this.opts.limits.maxTurns) {
          this.events.onLimit?.("turns");
          this.close();
          return;
        }
        this.listenOnce();
      });
    });
  }

  remainingMs(): number {
    if (!this.startedAt) return this.opts.limits.maxDurationMs;
    return Math.max(0, this.opts.limits.maxDurationMs - (Date.now() - this.startedAt));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.timers.forEach(clearTimeout);
    cancelAnimationFrame(this.raf);
    this.events.onViseme?.(0);
    this.events.onStatus?.("closed");
  }
}
