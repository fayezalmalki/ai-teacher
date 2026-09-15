/**
 * Teacher lines: extraction from a lesson definition, stable hashing, and the
 * Arabic character → mouth-shape mapping used to build lip-sync tracks from
 * TTS character timestamps. Shared by the render script (Node) and the
 * cascaded adapter (browser), so it must stay dependency-free.
 */
import type { LessonDefinition } from "@/lib/lesson-engine/types";
import { fill } from "@/lib/lesson-engine/template";
import type { Viseme, VisemeFrame } from "./types";

export interface TeacherLine {
  /** Where the line comes from, e.g. `step:a1`, `explain:2`, `endLine`. */
  id: string;
  /** Final text as spoken (placeholders filled). */
  text: string;
  hash: string;
}

/** All lines the teacher can speak in a lesson, for each child name. */
export function extractTeacherLines(lesson: LessonDefinition, names: string[]): TeacherLine[] {
  const raw: { id: string; text: string }[] = [];
  for (const [id, step] of Object.entries(lesson.steps)) raw.push({ id: `step:${id}`, text: step.text });
  lesson.explain.forEach((e, i) => raw.push({ id: `explain:${i}`, text: e.text }));
  for (const [concept, levels] of Object.entries(lesson.pools ?? {})) {
    levels.forEach((pool) => pool.forEach((q) => raw.push({ id: `pool:${concept}:${q.id}`, text: q.text })));
  }
  raw.push({ id: "endLine", text: lesson.endLine });
  raw.push({ id: "intro.line", text: lesson.intro.line });

  const seen = new Set<string>();
  const out: TeacherLine[] = [];
  for (const { id, text } of raw) {
    const variants = text.includes("{name}") ? names.map((name) => fill(text, { name })) : [text];
    for (const spoken of variants) {
      const hash = hashLine(spoken);
      if (seen.has(hash)) continue;
      seen.add(hash);
      out.push({ id, text: spoken, hash });
    }
  }
  return out;
}

/** Whitespace-normalized text so a stray space never causes a cache miss. */
export function normalizeLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** FNV-1a 32-bit over UTF-16 code units, as 8 hex chars. Same result in Node and browsers. */
export function hashLine(text: string): string {
  const s = normalizeLine(text);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/* ---------------------------------------------------------------------- */
/* Arabic letters → grouped visemes                                        */
/* ---------------------------------------------------------------------- */

const OPEN = new Set("اأإآةهحعءى");
const ROUND = new Set("وؤ");
const WIDE = new Set("يئ");
const LIPS = new Set("بم");
const LIP_TEETH = new Set("ف");
const TONGUE = new Set("تدنلثذطضظسزصر");
const BACK = new Set("كقغخجش");

/** Map one character to a viseme. Diacritics carry the vowel shape; anything else is rest. */
export function visemeForChar(ch: string): Viseme {
  if (OPEN.has(ch) || ch === "َ" /* fatha */ || ch === "ً" /* fathatan */) return 1;
  if (ROUND.has(ch) || ch === "ُ" /* damma */) return 2;
  if (WIDE.has(ch) || ch === "ِ" /* kasra */) return 3;
  if (LIPS.has(ch)) return 4;
  if (LIP_TEETH.has(ch)) return 5;
  if (TONGUE.has(ch)) return 6;
  if (BACK.has(ch)) return 7;
  if (/[0-9٠-٩]/.test(ch)) return 1; // digits are read aloud; open mouth
  if (/[A-Za-z]/.test(ch)) return 6;
  return 0;
}

export interface CharAlignment {
  chars: string[];
  /** Start time per character, in seconds. */
  starts: number[];
}

/**
 * Turn character timestamps (ElevenLabs `alignment`) into a compact viseme
 * track: one frame per change, plus a closing rest frame.
 */
export function visemesFromAlignment(a: CharAlignment, durationMs: number): VisemeFrame[] {
  const frames: VisemeFrame[] = [];
  let last: Viseme | null = null;
  for (let i = 0; i < a.chars.length; i++) {
    const v = visemeForChar(a.chars[i]);
    if (v === last) continue;
    frames.push({ t: Math.round(a.starts[i] * 1000), v });
    last = v;
  }
  if (last !== 0) frames.push({ t: durationMs, v: 0 });
  return frames;
}

/** Evenly spread characters across the clip when the TTS gives no timestamps. */
export function estimateAlignment(text: string, durationMs: number): CharAlignment {
  const chars = Array.from(normalizeLine(text));
  const step = durationMs / Math.max(1, chars.length) / 1000;
  return { chars, starts: chars.map((_, i) => i * step) };
}

/** Viseme active at time `t` (ms) in a sorted track. */
export function visemeAt(frames: VisemeFrame[], t: number): Viseme {
  let v: Viseme = 0;
  for (const f of frames) {
    if (f.t > t) break;
    v = f.v;
  }
  return v;
}

/* ---------------------------------------------------------------------- */
/* Manifest written by scripts/render-lines.ts                             */
/* ---------------------------------------------------------------------- */

export interface ManifestLine {
  id: string;
  text: string;
  /** File name relative to the manifest. */
  file: string;
  mime: string;
  durationMs: number;
  visemes: VisemeFrame[];
  /** Clip kept from an earlier voice/model after a failed render; the next run retries it. */
  stale?: true;
}

export interface LinesManifest {
  version: 1;
  lessonId: string;
  voice: { provider: string; voice: string; model: string };
  renderedAt: string;
  lines: Record<string, ManifestLine>;
}

export function manifestPath(lessonId: string): string {
  return `/audio/${lessonId}/manifest.json`;
}
