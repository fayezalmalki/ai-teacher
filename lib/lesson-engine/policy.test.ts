import { describe, expect, it } from "vitest";
import { clampLevel, resolvePolicy, DEFAULT_POLICY } from "./policy";
import { createInitialState, fractionsLesson, sessionReducer } from "./index";

describe("adaptation policy", () => {
  it("merges overrides onto the defaults", () => {
    expect(resolvePolicy()).toEqual(DEFAULT_POLICY);
    expect(resolvePolicy({ startLevel: 2 }, { maxLevel: 2 })).toMatchObject({ startLevel: 2, maxLevel: 2, levelUpAfterCorrect: 2 });
  });

  it("clamps levels to the lesson and the ceiling", () => {
    expect(clampLevel(0, 3)).toBe(1);
    expect(clampLevel(9, 3)).toBe(3);
    expect(clampLevel(3, 3, { ...DEFAULT_POLICY, maxLevel: 2 })).toBe(2);
  });

  it("starts a session at the parent's start level", () => {
    const s = createInitialState(fractionsLesson, { policy: { startLevel: 2 } });
    expect(s.difficulty).toBe(2);
    expect(createInitialState(fractionsLesson, { policy: { startLevel: 7 } }).difficulty).toBe(fractionsLesson.levels.length);
  });

  it("never raises above the ceiling and only notes a real change", () => {
    const ctx = { lesson: fractionsLesson, name: "x", policy: { startLevel: 2, maxLevel: 2 } };
    let s = sessionReducer(createInitialState(fractionsLesson, ctx), { type: "START", now: 1 }, ctx);
    const levelUpStep = Object.entries(fractionsLesson.steps).find(([, st]) => st.levelUp)![0];
    s = sessionReducer(s, { type: "GOTO", id: levelUpStep }, ctx);
    expect(s.difficulty).toBe(2);
    expect(s.adapt).toBeNull();
  });

  it("tracks answer streaks", () => {
    const ctx = { lesson: fractionsLesson, name: "x" };
    let s = sessionReducer(createInitialState(fractionsLesson), { type: "START", now: 1 }, ctx);
    s = sessionReducer(s, { type: "SPEECH_END" }, ctx);
    s = sessionReducer(s, { type: "INTRO_ANSWER", kind: "correct" }, ctx);
    s = sessionReducer(s, { type: "THINK_END" }, ctx);
    expect(s.correctStreak).toBe(1);
    expect(s.wrongStreak).toBe(0);
  });
});
