import { describe, expect, it } from "vitest";
import { fractionsLesson, toTurnState, createInitialState } from "@/lib/lesson-engine";
import { heuristicAssess, mockSynthesize, modelTurnToIntroKind, ttsConfigFromEnv } from "./providers";
import { silentWav, wavDurationMs } from "./wav";

const base = {
  teacherLine: fractionsLesson.steps.intro.text,
  turnState: toTurnState(createInitialState(fractionsLesson), fractionsLesson),
  childName: "سلمان",
  lesson: fractionsLesson,
};

describe("wav helpers", () => {
  it("round-trips a duration through a silent file", () => {
    expect(wavDurationMs(silentWav(2350))).toBe(2350);
  });
});

describe("mock synthesis", () => {
  it("uses the design timing and closes with rest", () => {
    const s = mockSynthesize("طيب، أي واحد أكبر؟");
    expect(s.durationMs).toBe(1800);
    expect(s.mime).toBe("audio/wav");
    const last = s.visemes[s.visemes.length - 1];
    expect(last.v).toBe(0);
    expect(last.t).toBeLessThanOrEqual(1800);
    expect(wavDurationMs(s.audio)).toBe(1800);
  });
  it("picks mock when no keys are configured", () => {
    expect(ttsConfigFromEnv({}).provider).toBe("mock");
    expect(ttsConfigFromEnv({ ELEVENLABS_API_KEY: "x", ELEVENLABS_VOICE_ID: "v" }).provider).toBe("elevenlabs");
    expect(ttsConfigFromEnv({ OPENAI_API_KEY: "x", TTS_PROVIDER: "mock" }).provider).toBe("mock");
  });
});

describe("heuristic assessment", () => {
  const kind = (transcript: string) => modelTurnToIntroKind(heuristicAssess({ ...base, transcript }), transcript);
  it("maps the four scripted intro answers to their branches", () => {
    for (const k of ["correct", "unclear", "dontknow", "strong"] as const) {
      expect(kind(fractionsLesson.introResponses[k].transcript)).toBe(k);
    }
  });
  it("treats silence as not knowing", () => {
    expect(kind("")).toBe("dontknow");
  });
  it("treats an off answer as unclear", () => {
    expect(kind("النصف يعني ثلاث قطع")).toBe("unclear");
  });
});
