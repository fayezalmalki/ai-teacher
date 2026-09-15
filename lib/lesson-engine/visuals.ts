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

export const VISUAL_KINDS = ["pizza", "fractions", "chocolate", "compare", "blocks", "numberline", "ruler", "balance", "cycle", "word", "cards", "chart", "table", "none"] as const;

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
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  if (v.kind === "blocks" && (!num(v.value) || (v.value as number) < 0 || (v.value as number) > 999)) out.push(`${where}: blocks.value must be 0–999`);
  if (v.kind === "numberline") {
    if (!num(v.from) || !num(v.to) || (v.to as number) <= (v.from as number)) out.push(`${where}: numberline needs from < to`);
    if (v.start !== undefined && (!num(v.start) || (v.start as number) < (v.from as number) || (v.start as number) > (v.to as number))) out.push(`${where}: numberline.start is outside from..to`);
  }
  if (v.kind === "ruler" && (!num(v.length) || (v.length as number) <= 0)) out.push(`${where}: ruler.length must be positive`);
  if (v.kind === "balance" && (!num(v.left) || !num(v.right))) out.push(`${where}: balance needs left and right`);
  if (v.kind === "word") {
    if (typeof v.text !== "string" || !v.text.trim()) out.push(`${where}: word.text is required`);
    else if (v.marks !== undefined && (!Array.isArray(v.marks) || v.marks.some((m) => !num(m) || (m as number) < 0 || (m as number) >= (v.text as string).length)))
      out.push(`${where}: word.marks must index into the text`);
  }
  if (v.kind === "cards") {
    const items = v.items as unknown;
    if (!Array.isArray(items) || items.length < 2 || items.length > 6 || items.some((it) => !it || typeof it.label !== "string" || !it.label))
      out.push(`${where}: cards.items needs 2–6 labelled items`);
    else if (v.highlight !== undefined && (!num(v.highlight) || (v.highlight as number) < 0 || (v.highlight as number) >= items.length)) out.push(`${where}: cards.highlight is outside items`);
  }
  if (v.kind === "chart") {
    const t = v.type as string;
    if (t === "bar") {
      const cats = v.categories as unknown;
      const vals = v.values as unknown;
      if (!Array.isArray(cats) || !Array.isArray(vals) || cats.length < 2 || cats.length !== vals.length || vals.some((x) => !num(x) || x < 0)) out.push(`${where}: chart.bar needs matching categories and non-negative values`);
    } else if (t === "pie") {
      const sl = v.slices as unknown;
      if (!Array.isArray(sl) || sl.length < 2 || sl.some((x) => !x || typeof x.label !== "string" || !num(x.value) || x.value <= 0)) out.push(`${where}: chart.pie needs at least two positive slices`);
    } else if (t === "box") {
      const b = v as Record<string, unknown>;
      const ks = ["min", "q1", "median", "q3", "max"];
      if (ks.some((k) => !num(b[k]))) out.push(`${where}: chart.box needs min, q1, median, q3, max`);
      else if (!((b.min as number) <= (b.q1 as number) && (b.q1 as number) <= (b.median as number) && (b.median as number) <= (b.q3 as number) && (b.q3 as number) <= (b.max as number))) out.push(`${where}: chart.box values must be in order`);
    } else out.push(`${where}: chart.type must be bar|pie|box`);
  }
  if (v.kind === "table") {
    const head = v.head as unknown;
    const rows = v.rows as unknown;
    if (!Array.isArray(head) || head.length < 1 || !Array.isArray(rows) || rows.length < 1 || rows.some((r) => !Array.isArray(r) || r.length !== head.length)) out.push(`${where}: table needs a head and rows of the same width`);
    else if (v.highlight !== undefined && (!num(v.highlight) || (v.highlight as number) < 0 || (v.highlight as number) >= rows.length)) out.push(`${where}: table.highlight is outside rows`);
  }
  if (v.kind === "cycle") {
    if (!Array.isArray(v.stages) || v.stages.length < 2) out.push(`${where}: cycle.stages needs at least two stages`);
    else if (v.highlight !== undefined && (!num(v.highlight) || (v.highlight as number) < 0 || (v.highlight as number) >= v.stages.length)) out.push(`${where}: cycle.highlight is outside stages`);
  }
  return out;
}
