import { describe, expect, it } from "vitest";
import { CHILD_CODE_LENGTH, CLASS_CODE_LENGTH, CODE_ALPHABET, isValidCode, joinUrl, newCode, normalizeCode } from "./code";

describe("join codes", () => {
  it("generates codes from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const c = newCode(CHILD_CODE_LENGTH);
      expect(c).toHaveLength(5);
      expect(isValidCode(c)).toBe(true);
    }
    expect(isValidCode(newCode(CLASS_CODE_LENGTH))).toBe(true);
    expect(CODE_ALPHABET).not.toMatch(/[01OIL]/);
  });
  it("normalizes what people type or paste", () => {
    expect(normalizeCode(" k7p-3q ")).toBe("K7P3Q");
    expect(normalizeCode("https://school.mvp.sa/j/ABC234?x=1")).toBe("ABC234");
    expect(isValidCode("K7P3Q")).toBe(true);
    expect(isValidCode("K7P3")).toBe(false);
    expect(isValidCode("K7P3O")).toBe(false);
  });
  it("builds the share url", () => {
    expect(joinUrl("https://school.mvp.sa/", "ABC23")).toBe("https://school.mvp.sa/j/ABC23");
  });
});
