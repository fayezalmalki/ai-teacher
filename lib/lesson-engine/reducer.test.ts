import { describe, expect, it } from "vitest";
import {
  afterSpeech,
  createInitialState,
  engineStateJson,
  fractionsLesson,
  observationNotes,
  parseModelTurn,
  progressDots,
  ratingLabel,
  sessionReducer,
  type DemoPath,
  type SessionAction,
  type SessionState,
} from "./index";

const ctx = { lesson: fractionsLesson, name: "سلمان" };

function run(actions: SessionAction[], from = createInitialState(fractionsLesson)): SessionState {
  return actions.reduce((s, a) => sessionReducer(s, a, ctx), from);
}

/** Drive the machine like the runtime does: finish speaking, pause, think. */
function settle(state: SessionState): SessionState {
  let s = state;
  for (let i = 0; i < 20; i++) {
    if (s.screen !== "lesson") return s;
    if (s.phase === "thinking") {
      s = sessionReducer(s, { type: "THINK_END" }, ctx);
      continue;
    }
    if (s.phase === "speaking") {
      const next = afterSpeech(s, fractionsLesson);
      s =
        next.kind === "pause"
          ? sessionReducer(s, { type: "GOTO", id: next.next }, ctx)
          : sessionReducer(s, { type: "SPEECH_END" }, ctx);
      continue;
    }
    return s;
  }
  return s;
}

function answer(state: SessionState, path: DemoPath): SessionState {
  return settle(sessionReducer(state, { type: "DEMO", path }, ctx));
}

describe("fractions lesson state machine", () => {
  it("starts at intro and waits for a voice answer", () => {
    const s = settle(run([{ type: "START", now: 1000 }]));
    expect(s.step).toBe("intro");
    expect(s.phase).toBe("listening");
    expect(s.startedAt).toBe(1000);
  });

  it("happy path: intro correct → a1 → a2 → a3 (level up) → h1 → h2 → END", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "understands");
    expect(s.step).toBe("a2");
    expect(s.phase).toBe("choosing");
    expect(s.log[0]).toBe("فهم سلمان مفهوم النصف من الشرح الأول.");
    s = answer(s, "understands");
    expect(s.step).toBe("h1");
    expect(s.difficulty).toBe(2);
    expect(s.visited).toContain("a3");
    s = answer(s, "understands");
    expect(s.screen).toBe("end");
    expect(s.questions).toBe(3);
    expect(s.correct).toBe(3);
    expect(ratingLabel(s.questions, s.correct, fractionsLesson)).toBe("ممتاز");
    expect(progressDots(s, fractionsLesson)).toEqual([true, true, true, true, true]);
    expect(observationNotes(s.visited, fractionsLesson)).toEqual([
      "فهمت النصف بسرعة.",
      "أصبحت أفضل في المقارنة بين الكسور.",
      "جاوبت على سؤال أعلى من مستوى البداية.",
    ]);
  });

  it("confused path: intro dontknow → b1 (chocolate) → b3 → b4 → a2", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "confused");
    expect(s.visited).toEqual(["intro", "b1", "b2", "b3"]);
    expect(s.strategy).toBe("chocolate_visual");
    expect(s.reexplain).toBe(1);
    expect(s.adapt).toBeNull(); // adapt chip belongs to b1 and clears on the next step
    // chocPick: choices only once two squares are picked; DEMO bypasses the tap
    s = answer(s, "understands");
    expect(s.step).toBe("a2");
    expect(s.log).toContain("أعطى المعلم سؤالًا أبسط للتأكد من الفهم، وأجاب سلمان صحيحًا.");
  });

  it("wrong compare: a2 wrong → c1 → c2 → c2r (retry) → c3 (level up) → h1", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "understands");
    s = answer(s, "wrong");
    expect(s.step).toBe("c2");
    expect(s.log).toContain("أخطأ سلمان في مقارنة 1/2 و1/4، فأعاد المعلم الشرح بصريًا بدائرتين متساويتين.");
    s = answer(s, "wrong");
    expect(s.step).toBe("c2r");
    expect(s.questions).toBe(3); // retry does not count
    s = answer(s, "understands");
    expect(s.step).toBe("h1");
    expect(s.difficulty).toBe(2);
    expect(observationNotes(s.visited, fractionsLesson)).toContain(
      "تعلمت المقارنة بين الكسور بعد أن شفت الفرق بنفسك.",
    );
  });

  it("strong path skips straight to a3", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "strong");
    expect(s.visited).toEqual(["intro", "a3", "h1"]);
    expect(s.understanding).toBe("strong");
  });

  it("h1 wrong → h1r retry → h2 → END", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "strong");
    s = answer(s, "wrong");
    expect(s.step).toBe("h1r");
    expect(s.reexplain).toBe(1);
    s = answer(s, "understands");
    expect(s.screen).toBe("end");
  });

  it("bonus question then summary", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "strong");
    s = answer(s, "understands");
    s = settle(sessionReducer(s, { type: "BONUS" }, ctx));
    expect(s.step).toBe("x1");
    s = answer(s, "understands");
    expect(s.screen).toBe("summary");
    expect(s.log[s.log.length - 1]).toBe("أجاب على السؤال الإضافي بنجاح.");
  });

  it("chocolate squares toggle up to two", () => {
    let s = settle(run([{ type: "START", now: 0 }]));
    s = answer(s, "confused");
    s = run([{ type: "TOGGLE_SQUARE", index: 0 }, { type: "TOGGLE_SQUARE", index: 3 }, { type: "TOGGLE_SQUARE", index: 1 }], s);
    expect(s.selected).toEqual([0, 3]);
    s = run([{ type: "TOGGLE_SQUARE", index: 0 }], s);
    expect(s.selected).toEqual([3]);
  });

  it("demo buttons are ignored while the teacher speaks", () => {
    const s = run([{ type: "START", now: 0 }, { type: "DEMO", path: "understands" }]);
    expect(s.step).toBe("intro");
    expect(s.phase).toBe("speaking");
  });

  it("fills the child's name into copy", () => {
    const s = settle(run([{ type: "START", now: 0 }], createInitialState(fractionsLesson)));
    const t = sessionReducer(s, { type: "INTRO_ANSWER", kind: "correct" }, { ...ctx, name: "ليان" });
    expect(t.pending?.extra?.log?.[0]).toBe("فهم ليان مفهوم النصف من الشرح الأول.");
  });

  it("exposes engine state json", () => {
    const s = settle(run([{ type: "START", now: 0 }]));
    expect(JSON.parse(engineStateJson(s, fractionsLesson))).toMatchObject({
      concept: "one-half",
      difficulty: 1,
      understanding: "unknown",
      strategy: "pizza_visual",
      phase: "listening",
    });
  });
});

describe("model turn contract", () => {
  it("accepts a valid turn", () => {
    const turn = parseModelTurn({
      assessment: "confused",
      next_action: "different_example",
      difficulty_change: -1,
      teaching_strategy: "concrete_visual_example",
      visual: "chocOne",
      response: "خلنا نجربها بطريقة ثانية...",
    });
    expect(turn.visual).toBe("chocOne");
  });
  it("rejects unknown visuals", () => {
    expect(() =>
      parseModelTurn({ assessment: "wrong", next_action: "retry", difficulty_change: 0, visual: "cake", response: "x" }),
    ).toThrow(/visual/);
  });
});
