import { describe, expect, it } from "vitest";
import { LESSON_LIST, getLesson, lessonTitle } from "./index";
import { validateLesson } from "./validate";
import { fractionsLesson } from "./index";

describe("lesson registry", () => {
  it("registers every lesson under its id", () => {
    for (const l of LESSON_LIST) expect(getLesson(l.id)).toBe(l);
    expect(lessonTitle("nope")).toBe("nope");
  });

  for (const l of LESSON_LIST) {
    it(`"${l.id}" is a sound lesson graph`, () => {
      expect(validateLesson(l)).toEqual([]);
    });
  }

  it("reports broken graphs", () => {
    const broken = {
      ...fractionsLesson,
      entry: "missing",
      steps: { ...fractionsLesson.steps, intro: { ...fractionsLesson.steps.intro, visual: "nope" as never } },
    };
    const problems = validateLesson(broken);
    expect(problems.some((p) => p.includes('entry "missing"'))).toBe(true);
    expect(problems.some((p) => p.includes("unknown visual id"))).toBe(true);
  });
});
