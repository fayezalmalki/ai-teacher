import { describe, expect, it } from "vitest";
import { createInitialState, currentStep, drawPoolQuestion, getChoices, sessionReducer } from "./index";
import type { EngineContext, LessonDefinition } from "./types";
import { validateLesson } from "@/lib/lessons/validate";
import { extractTeacherLines } from "@/lib/voice/lines";

/** A minimal lesson with one pooled concept across three levels. */
const lesson: LessonDefinition = {
  id: "t",
  title: "t",
  subject: "s",
  subjectId: "math",
  teacher: "n",
  durationLabel: "1",
  levels: ["L1", "L2", "L3"],
  levelUpAdapt: "up → {level}",
  levelDownAdapt: "down → {level}",
  entry: "q",
  bonusEntry: "q",
  choiceSets: {},
  pools: {
    add: [
      [
        { id: "a1", text: "one?", visual: { kind: "blocks", value: 1 }, choices: [{ l: "1", ok: true }, { l: "2" }] },
        { id: "a2", text: "two?", visual: { kind: "blocks", value: 2 }, choices: [{ l: "2", ok: true }, { l: "3" }] },
      ],
      [{ id: "b1", text: "ten?", visual: { kind: "numberline", from: 0, to: 20 }, choices: [{ l: "10", ok: true }, { l: "11" }] }],
      [{ id: "c1", text: "hundred?", visual: { kind: "blocks", value: 100 }, choices: [{ l: "100", ok: true }, { l: "10" }] }],
    ],
  },
  steps: {
    q: { text: "pool", visual: { kind: "none" }, concept: "add", pool: "add", onOk: "done", onWrong: "q", onLevelDown: "re", askCount: 3 },
    re: { text: "again {name}", visual: { kind: "none" }, concept: "add", next: "done", reexplain: true },
    done: { text: "done", visual: { kind: "none" }, concept: "add", next: "END" },
  },
  introResponses: {
    correct: { transcript: "", understanding: "good", go: "q", log: "", questions: 0, correct: 0 },
    unclear: { transcript: "", understanding: "unclear", go: "q", log: "", questions: 0, correct: 0 },
    dontknow: { transcript: "", understanding: "confused", go: "q", log: "", questions: 0, correct: 0 },
    strong: { transcript: "", understanding: "strong", go: "q", log: "", questions: 0, correct: 0 },
  },
  choiceTranscript: "{choice}",
  progress: [["q"], ["END"]],
  notes: [],
  rating: [{ min: 0, label: "ok" }],
  endLine: "end",
  ask: { cta: "", title: "", greeting: "", hint: "", done: "", unavailable: "", scope: "" },
  askLog: "",
  thinkingLabel: "",
  thinkingRetryLabel: "",
  explain: [{ text: "e", visual: { kind: "ruler", length: 5 } }],
  intro: { eyebrow: "", title: "", line: "hi" },
};

const ctx: EngineContext = { lesson, name: "x" };

function answer(state: ReturnType<typeof createInitialState>, ok: boolean, c: EngineContext = ctx) {
  const choices = getChoices(lesson, currentStep(state, lesson));
  const index = choices.findIndex((x) => !!x.ok === ok);
  let s = sessionReducer(state, { type: "SPEECH_END" }, c);
  s = sessionReducer(s, { type: "PICK", index }, c);
  return sessionReducer(s, { type: "THINK_END" }, c);
}

describe("question pools", () => {
  it("draws the first unasked question at the current level, then falls back", () => {
    expect(drawPoolQuestion(lesson, "add", 1, [])?.id).toBe("a1");
    expect(drawPoolQuestion(lesson, "add", 1, ["a1"])?.id).toBe("a2");
    expect(drawPoolQuestion(lesson, "add", 1, ["a1", "a2"])?.id).toBe("a1");
    expect(drawPoolQuestion(lesson, "add", 3, [])?.id).toBe("c1");
    expect(drawPoolQuestion(lesson, "add", 9, [])?.id).toBe("c1");
    expect(drawPoolQuestion(lesson, "nope", 1, [])).toBeNull();
  });

  it("merges the drawn question into the current step", () => {
    const s = sessionReducer(createInitialState(lesson), { type: "START", now: 1 }, ctx);
    expect(s.poolQuestion).toBe("a1");
    const st = currentStep(s, lesson);
    expect(st.text).toBe("one?");
    expect(getChoices(lesson, st).map((c) => c.l)).toEqual(["1", "2"]);
  });

  it("raises the level after two correct answers, keeps asking until askCount, then moves on", () => {
    let s = sessionReducer(createInitialState(lesson), { type: "START", now: 1 }, ctx);
    s = answer(s, true);
    expect(s.difficulty).toBe(1);
    expect(s.step).toBe("q");
    expect(s.poolQuestion).toBe("a2");
    s = answer(s, true);
    expect(s.difficulty).toBe(2);
    expect(s.adapt).toBe("up → L2");
    expect(s.log).toContain("up → L2");
    expect(s.step).toBe("q");
    expect(s.poolQuestion).toBe("b1");
    expect(s.concepts.add).toEqual({ asked: 2, correct: 2 });
    s = answer(s, true);
    expect(s.step).toBe("done");
    expect(s.poolCorrect.q).toBe(3);
  });

  it("lowers the level after two wrong answers and re-explains", () => {
    const start = { lesson, name: "x", policy: { startLevel: 2 } };
    let s = sessionReducer(createInitialState(lesson, start), { type: "START", now: 1 }, start);
    expect(s.poolQuestion).toBe("b1");
    s = answer(s, false);
    expect(s.difficulty).toBe(2);
    s = answer(s, false);
    expect(s.difficulty).toBe(1);
    expect(s.step).toBe("re");
    expect(s.adapt).toBe("down → L1");
    expect(s.startDifficulty).toBe(2);
  });

  it("never rises above the ceiling", () => {
    const c = { lesson, name: "x", policy: { maxLevel: 1 } };
    let s = sessionReducer(createInitialState(lesson, c), { type: "START", now: 1 }, c);
    s = answer(s, true, c);
    s = answer(s, true, c);
    expect(s.difficulty).toBe(1);
    expect(s.step).toBe("q");
  });

  it("validates pools and extracts their lines for rendering", () => {
    expect(validateLesson(lesson)).toEqual([]);
    const ids = extractTeacherLines(lesson, ["x"]).map((l) => l.id);
    expect(ids).toContain("pool:add:a1");
    expect(ids).toContain("pool:add:c1");
    const broken = { ...lesson, pools: { add: [[{ ...lesson.pools!.add[0][0], choices: [{ l: "1" }] }]], unused: [[]] } };
    const problems = validateLesson(broken);
    expect(problems.some((p) => p.includes("no correct choice"))).toBe(true);
    expect(problems.some((p) => p.includes("never used"))).toBe(true);
  });
});
