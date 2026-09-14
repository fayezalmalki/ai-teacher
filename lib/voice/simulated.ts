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

/**
 * Simulated voice: no audio. Speaking lasts max(1800ms, 55ms × chars);
 * listening lasts 1800ms and returns a scripted transcript.
 */
export class SimulatedVoiceAdapter implements VoiceAdapter {
  readonly kind = "simulated" as const;
  private controller: AbortController | null = null;

  constructor(private pace: Pace = "demo") {}

  setPace(pace: Pace) {
    this.pace = pace;
  }

  async isAvailable() {
    return true;
  }

  async speak(text: string, opts?: SpeakOptions) {
    const c = this.begin(opts?.signal);
    await wait(scaled(speakDuration(text), this.pace), c.signal);
  }

  async listen(opts?: ListenOptions): Promise<ListenResult> {
    const c = this.begin(opts?.signal);
    await wait(scaled(RECORD_MS, this.pace), c.signal);
    return { transcript: opts?.expectedKind ?? "" };
  }

  interrupt() {
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
