import { RECORD_MS, speakDuration, scaled, type Pace } from "@/lib/lesson-engine/timing";
import type { ListenOptions, ListenResult, SpeakOptions, VoiceAdapter } from "./types";

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export interface SilentOptions {
  pace?: Pace;
  /**
   * Reading mode: a line stays on screen until `advance()` is called (the
   * child taps التالي) instead of ending on a timer estimated from its length.
   */
  manual?: boolean;
}

/**
 * Silent voice: no audio. Timer mode (the old "simulated" adapter) estimates
 * speaking as max(1800ms, 55ms × chars) and scripts the listen result; manual
 * mode is the reading-mode runtime, where the child paces the lesson.
 */
export class SilentVoiceAdapter implements VoiceAdapter {
  readonly kind = "simulated" as const;
  private controller: AbortController | null = null;
  private pace: Pace;
  readonly manual: boolean;
  private release: (() => void) | null = null;

  constructor(options: SilentOptions | Pace = {}) {
    const opts = typeof options === "string" ? { pace: options } : options;
    this.pace = opts.pace ?? "demo";
    this.manual = !!opts.manual;
  }

  setPace(pace: Pace) {
    this.pace = pace;
  }

  async isAvailable() {
    return true;
  }

  async speak(text: string, opts?: SpeakOptions) {
    const c = this.begin(opts?.signal);
    if (!this.manual) {
      await wait(scaled(speakDuration(text), this.pace), c.signal);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      if (c.signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
      this.release = resolve;
      c.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
  }

  /** Reading mode: the child tapped التالي; finish the line on screen. */
  advance() {
    const r = this.release;
    this.release = null;
    r?.();
  }

  /** True while a line waits for advance(). */
  get waiting() {
    return this.release !== null;
  }

  async listen(opts?: ListenOptions): Promise<ListenResult> {
    const c = this.begin(opts?.signal);
    await wait(scaled(RECORD_MS, this.pace), c.signal);
    return { transcript: opts?.expectedKind ?? "" };
  }

  interrupt() {
    this.release = null;
    this.controller?.abort();
    this.controller = null;
  }

  dispose() {
    this.interrupt();
  }

  private begin(outer?: AbortSignal): AbortController {
    this.interrupt();
    const c = new AbortController();
    outer?.addEventListener("abort", () => c.abort(), { once: true });
    this.controller = c;
    return c;
  }
}

/** Old name, kept for callers written against the timer-driven adapter. */
export { SilentVoiceAdapter as SimulatedVoiceAdapter };
