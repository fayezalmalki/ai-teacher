import { describe, expect, it } from "vitest";
import type { SessionResult } from "@/lib/lesson-engine/types";
import { activeChild, appendResult, createChild, defaultState, fromStorage, migrateLegacy, normalize, removeChildFrom, MAX_RESULTS } from "./state";

const result = (lessonId: string): SessionResult => ({
  lessonId,
  childName: "x",
  startedAt: 1,
  endedAt: 2,
  questions: 3,
  correct: 2,
  reexplain: 0,
  startDifficulty: 1,
  endDifficulty: 2,
  log: [],
  visited: [],
  rating: "ممتاز",
  askTurns: [],
});

describe("store state v2", () => {
  it("starts with the demo child active", () => {
    const s = defaultState(0);
    expect(s.children).toHaveLength(1);
    expect(activeChild(s).name).toBe("سلمان");
    expect(activeChild(s).settings.sound).toBe("voice");
    expect(activeChild(s).settings.startLevel).toBe(1);
  });

  it("migrates a v1 record into one child with its settings and last result", () => {
    const s = migrateLegacy({
      child: { name: "نورة", age: 8, grade: 2 },
      pin: "4321",
      settings: { dailyMinutes: 15, liveAsk: false },
      lastResult: result("fractions"),
      onboarded: true,
    });
    const c = activeChild(s);
    expect(c.name).toBe("نورة");
    expect(c.settings).toMatchObject({ dailyMinutes: 15, liveAsk: false, reminder: true, sound: "voice" });
    expect(c.results).toHaveLength(1);
    expect(s.pin).toBe("4321");
    expect(s.onboarded).toBe(true);
  });

  it("prefers v2 storage, then v1, then defaults", () => {
    const v2 = JSON.stringify(normalize({ children: [createChild({ name: "علي", age: 7, grade: 1 })], onboarded: true }));
    expect(activeChild(fromStorage(v2, null)).name).toBe("علي");
    expect(activeChild(fromStorage(null, JSON.stringify({ child: { name: "سارة" } }))).name).toBe("سارة");
    expect(activeChild(fromStorage("not json", null)).name).toBe("سلمان");
  });

  it("fills new settings keys on old v2 records", () => {
    const stored = { children: [{ ...createChild({ name: "x", age: 9, grade: 3 }), settings: { dailyMinutes: 20 } }] };
    const c = activeChild(normalize(stored as never));
    expect(c.settings.dailyMinutes).toBe(20);
    expect(c.settings.sound).toBe("voice");
  });

  it("gives siblings different avatar colours", () => {
    const a = createChild({ name: "a", age: 9, grade: 3 });
    const b = createChild({ name: "b", age: 9, grade: 3 }, [a]);
    expect(b.color).not.toBe(a.color);
  });

  it("caps the per-child history and keeps the newest", () => {
    let s = defaultState(0);
    const id = s.activeChildId;
    for (let i = 0; i < MAX_RESULTS + 5; i++) s = appendResult(s, id, result("l" + i));
    expect(activeChild(s).results).toHaveLength(MAX_RESULTS);
    expect(activeChild(s).results.at(-1)?.lessonId).toBe("l" + (MAX_RESULTS + 4));
  });

  it("removing the active child activates another, and the last one resets to the demo child", () => {
    let s = defaultState(0);
    const second = createChild({ name: "b", age: 9, grade: 3 }, s.children);
    s = { ...s, children: [...s.children, second], activeChildId: second.id };
    s = removeChildFrom(s, second.id);
    expect(activeChild(s).name).toBe("سلمان");
    s = removeChildFrom(s, s.activeChildId);
    expect(s.children).toHaveLength(1);
    expect(activeChild(s).name).toBe("سلمان");
  });
});
