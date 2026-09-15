/**
 * Visuals a lesson step can show. A step names one either by a parametric
 * spec ({ kind, ...props }) or by one of the fractions-era ids, which map to
 * specs here so the existing lesson JSON and rendered audio keep working.
 */
import type { VisualId, VisualRef, VisualSpec } from "./types";

export const VISUAL_ALIASES: Record<VisualId, VisualSpec> = {
  pizzaHalf: { kind: "pizza", filled: 2, dividers: "v" },
  pizza34: { kind: "pizza", filled: 3, dividers: "vh" },
  fractions: { kind: "fractions", pairs: [{ n: "1", d: "2" }, { n: "1", d: "4" }] },
  fractions34: { kind: "fractions", pairs: [{ n: "3", d: "4" }, { n: "1", d: "2" }] },
  chocOne: { kind: "chocolate", mode: "one" },
  chocTwo: { kind: "chocolate", mode: "two" },
  chocPick: { kind: "chocolate", mode: "pick" },
  compare: { kind: "compare" },
  comparePick: { kind: "compare", pick: true },
};

export const VISUAL_KINDS = ["pizza", "fractions", "chocolate", "compare", "none"] as const;

export function resolveVisual(ref: VisualRef | undefined): VisualSpec {
  if (!ref) return { kind: "none" };
  if (typeof ref === "string") return VISUAL_ALIASES[ref] ?? { kind: "none" };
  return ref;
}

/** Steps whose visual collects the answer by tapping pieces (the chocolate pick). */
export function visualNeedsPick(ref: VisualRef | undefined): boolean {
  const v = resolveVisual(ref);
  return v.kind === "chocolate" && v.mode === "pick";
}

/** Stable key so React remounts (and pops in) a visual when its spec changes. */
export function visualKey(ref: VisualRef | undefined): string {
  return typeof ref === "string" ? ref : JSON.stringify(resolveVisual(ref));
}

/** Problems with a visual reference, for the lesson validator. */
export function visualProblems(ref: unknown, where: string): string[] {
  if (typeof ref === "string") return ref in VISUAL_ALIASES ? [] : [`${where}: unknown visual id "${ref}"`];
  if (!ref || typeof ref !== "object") return [`${where}: visual must be an id or a { kind } object`];
  const v = ref as Partial<VisualSpec> & Record<string, unknown>;
  if (!VISUAL_KINDS.includes(v.kind as (typeof VISUAL_KINDS)[number])) return [`${where}: unknown visual kind "${String(v.kind)}"`];
  const out: string[] = [];
  if (v.kind === "pizza") {
    if (![0, 1, 2, 3, 4].includes(v.filled as number)) out.push(`${where}: pizza.filled must be 0–4`);
    if (!["none", "v", "vh"].includes(v.dividers as string)) out.push(`${where}: pizza.dividers must be none|v|vh`);
  }
  if (v.kind === "fractions" && (!Array.isArray(v.pairs) || v.pairs.length === 0)) out.push(`${where}: fractions.pairs must be a non-empty list`);
  if (v.kind === "chocolate" && !["one", "two", "pick"].includes(v.mode as string)) out.push(`${where}: chocolate.mode must be one|two|pick`);
  return out;
}
