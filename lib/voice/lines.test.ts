import { describe, expect, it } from "vitest";
import { fractionsLesson } from "@/lib/lesson-engine";
import {
  estimateAlignment,
  extractTeacherLines,
  hashLine,
  visemeAt,
  visemeForChar,
  visemesFromAlignment,
} from "./lines";

describe("teacher lines", () => {
  it("extracts every spoken line once, with names filled", () => {
    const lines = extractTeacherLines(fractionsLesson, ["سلمان", "ليان"]);
    const ids = lines.map((l) => l.id);
    expect(ids).toContain("step:intro");
    expect(ids).toContain("explain:3");
    expect(ids).toContain("endLine");
    // intro has {name} → one per name; a1 has none → once
    expect(lines.filter((l) => l.id === "step:intro")).toHaveLength(2);
    expect(lines.filter((l) => l.id === "step:a1")).toHaveLength(1);
    expect(lines.every((l) => !l.text.includes("{name}"))).toBe(true);
    expect(new Set(lines.map((l) => l.hash)).size).toBe(lines.length);
  });

  it("hashes are stable and whitespace-insensitive", () => {
    expect(hashLine("طيب، أي واحد أكبر؟")).toBe(hashLine("  طيب،   أي واحد أكبر؟ "));
    expect(hashLine("a")).not.toBe(hashLine("b"));
    expect(hashLine("خلنا نشوفها مع بعض.")).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("visemes", () => {
  it("maps Arabic letters to grouped mouth shapes", () => {
    expect(visemeForChar("ب")).toBe(4);
    expect(visemeForChar("م")).toBe(4);
    expect(visemeForChar("ف")).toBe(5);
    expect(visemeForChar("و")).toBe(2);
    expect(visemeForChar("ي")).toBe(3);
    expect(visemeForChar("ا")).toBe(1);
    expect(visemeForChar("ك")).toBe(7);
    expect(visemeForChar("ت")).toBe(6);
    expect(visemeForChar(" ")).toBe(0);
    expect(visemeForChar("4")).toBe(1);
  });

  it("collapses repeated shapes and closes with rest", () => {
    const frames = visemesFromAlignment({ chars: ["ب", "ب", "ا", " ", "م"], starts: [0, 0.1, 0.2, 0.3, 0.4] }, 600);
    expect(frames).toEqual([
      { t: 0, v: 4 },
      { t: 200, v: 1 },
      { t: 300, v: 0 },
      { t: 400, v: 4 },
      { t: 600, v: 0 },
    ]);
    expect(visemeAt(frames, 250)).toBe(1);
    expect(visemeAt(frames, 700)).toBe(0);
  });

  it("estimates an alignment when the TTS has no timestamps", () => {
    const a = estimateAlignment("بيتزا", 1000);
    expect(a.chars).toHaveLength(5);
    expect(a.starts[4]).toBeCloseTo(0.8);
  });
});
