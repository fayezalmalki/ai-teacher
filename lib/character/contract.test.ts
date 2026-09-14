import { describe, expect, it } from "vitest";
import { resolveCharacterMode, STATES, STATE_INDEX, toViseme, VISEMES } from "./contract";

describe("character contract", () => {
  it("numbers the five states in order", () => {
    expect(STATES.map((s) => STATE_INDEX[s])).toEqual([0, 1, 2, 3, 4]);
  });
  it("covers the eight visemes", () => {
    expect(VISEMES).toHaveLength(8);
    expect(toViseme(9)).toBe(7);
    expect(toViseme(-1)).toBe(0);
    expect(toViseme(2.4)).toBe(2);
  });
  it("resolves the mode from the query first", () => {
    expect(resolveCharacterMode("rive")).toBe("rive");
    expect(resolveCharacterMode("glyph")).toBe("glyph");
    expect(resolveCharacterMode("nonsense")).toBe("svg");
    expect(resolveCharacterMode(null)).toBe("svg");
  });
});
