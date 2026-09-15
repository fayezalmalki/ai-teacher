import { describe, expect, it } from "vitest";
import type { SessionResult } from "@/lib/lesson-engine/types";
import { createChild, defaultState } from "./state";
import { hasLocalChanges, isPristine, mergeRemote, toRemote } from "./merge";

const result = (lessonId: string, startedAt: number): SessionResult => ({
  lessonId,
  childName: "x",
  startedAt,
  endedAt: startedAt + 60000,
  questions: 3,
  correct: 2,
  reexplain: 0,
  startDifficulty: 1,
  endDifficulty: 2,
  log: [],
  visited: [],
  rating: "جيد",
  askTurns: [],
});

describe("household merge", () => {
  it("round-trips a state through the remote shape", () => {
    let s = defaultState(0);
    s = { ...s, children: [{ ...s.children[0], results: [result("fractions", 10)] }] };
    const remote = toRemote(s);
    expect(remote.children[0].clientId).toBe(s.children[0].id);
    expect(remote.results[0].childClientId).toBe(s.children[0].id);
    expect(mergeRemote(s, remote)).toEqual(s);
    expect(hasLocalChanges(s, remote)).toBe(false);
  });

  it("adds remote children and results without duplicating what the device has", () => {
    const base = defaultState(0);
    const s = { ...base, children: [{ ...base.children[0], results: [result("fractions", 10)] }] };
    const other = createChild({ name: "نورة", age: 8, grade: 2 }, s.children, 5);
    const remote = {
      children: [...toRemote(s).children, { ...toRemote({ ...s, children: [other] }).children[0] }],
      results: [
        ...toRemote(s).results,
        { ...result("water", 20), childClientId: other.id },
        { ...result("fractions", 10), childClientId: s.children[0].id },
      ],
    };
    const merged = mergeRemote(s, remote);
    expect(merged.children).toHaveLength(2);
    expect(merged.children[0].results).toHaveLength(1);
    expect(merged.children[1].name).toBe("نورة");
    expect(merged.children[1].results[0].lessonId).toBe("water");
    expect(merged.children[1].results[0].childName).toBe("نورة");
    expect(merged.activeChildId).toBe(s.activeChildId);
  });

  it("lets the newer profile edit win in either direction", () => {
    const s = defaultState(0);
    const id = s.children[0].id;
    const older = { ...toRemote(s).children[0], name: "قديم", updatedAt: 0 };
    const newer = { ...toRemote(s).children[0], name: "جديد", updatedAt: 99 };
    expect(mergeRemote({ ...s, children: [{ ...s.children[0], updatedAt: 50 }] }, { children: [older], results: [] }).children[0].name).toBe("سلمان");
    expect(mergeRemote(s, { children: [newer], results: [] }).children[0].name).toBe("جديد");
    expect(hasLocalChanges({ ...s, children: [{ ...s.children[0], updatedAt: 50 }] }, { children: [older], results: [] })).toBe(true);
    expect(mergeRemote(s, { children: [newer], results: [] }).children[0].id).toBe(id);
  });

  it("adopts the account's children on a device nobody used yet", () => {
    const fresh = defaultState(0);
    expect(isPristine(fresh)).toBe(true);
    const other = createChild({ name: "نورة", age: 8, grade: 2 }, [], 5);
    const remote = toRemote({ ...fresh, children: [other], activeChildId: other.id });
    const merged = mergeRemote(fresh, remote);
    expect(merged.children.map((c) => c.name)).toEqual(["نورة"]);
    expect(merged.activeChildId).toBe(other.id);
    expect(hasLocalChanges(fresh, remote)).toBe(false);
    // An empty account gets the demo child instead.
    expect(mergeRemote(fresh, { children: [], results: [] }).children).toHaveLength(1);
    expect(isPristine({ ...fresh, onboarded: true })).toBe(false);
  });

  it("reports local-only sessions as changes", () => {
    const base = defaultState(0);
    const s = { ...base, children: [{ ...base.children[0], results: [result("measure", 30)] }] };
    expect(hasLocalChanges(s, { children: toRemote(s).children, results: [] })).toBe(true);
  });
});
