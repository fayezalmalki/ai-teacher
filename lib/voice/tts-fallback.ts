/**
 * Browser SpeechSynthesis fallback for teacher lines when no realtime channel
 * is available. Arabic voices are inconsistent across platforms, so this is
 * best-effort: if no `ar-*` voice exists we resolve on the simulated timing.
 */
import { speakDuration } from "@/lib/lesson-engine/timing";
import type { ListenOptions, ListenResult, SpeakOptions, VoiceAdapter } from "./types";

export class TtsFallbackAdapter implements VoiceAdapter {
  readonly kind = "simulated" as const;
  private utterance: SpeechSynthesisUtterance | null = null;

  async isAvailable() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async speak(text: string, opts?: SpeakOptions) {
    if (!(await this.isAvailable())) {
      await new Promise((r) => setTimeout(r, speakDuration(text)));
      return;
    }
    const synth = window.speechSynthesis;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ar"));
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      opts?.signal?.addEventListener("abort", () => {
        synth.cancel();
        resolve();
      });
      this.utterance = u;
      synth.cancel();
      synth.speak(u);
    });
  }

  async listen(_opts?: ListenOptions): Promise<ListenResult> {
    void _opts;
    // No STT here: the UI falls back to choice buttons.
    return { transcript: "" };
  }

  interrupt() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    this.utterance = null;
  }

  dispose() {
    this.interrupt();
  }
}
