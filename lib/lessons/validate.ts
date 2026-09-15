/**
 * Structural checks for a lesson definition. Returns human-readable problems;
 * an empty list means the graph is sound. Runs in lessons.test.ts for every
 * registered lesson and is cheap enough to run on authored drafts.
 */
import { END_STEP, SUMMARY_STEP, type LessonDefinition, type LessonStep } from "@/lib/lesson-engine/types";
import { visualProblems } from "@/lib/lesson-engine/visuals";

const EXITS = new Set([END_STEP, SUMMARY_STEP]);

function targetsOf(step: LessonStep, lesson?: LessonDefinition): string[] {
  const out: string[] = [];
  if (step.next) out.push(step.next);
  // A listening step branches through the intro responses.
  if (step.listen && lesson) out.push(...Object.values(lesson.introResponses ?? {}).map((r) => r.go));
  if (step.onOk) out.push(step.onOk);
  if (step.onWrong) out.push(step.onWrong);
  if (step.compare) out.push(step.compare.onOk, step.compare.onWrong);
  if (step.onLevelDown) out.push(step.onLevelDown);
  return out;
}

export function validateLesson(lesson: LessonDefinition): string[] {
  const problems: string[] = [];
  const steps = lesson.steps ?? {};
  const has = (id: string) => EXITS.has(id) || id in steps;

  if (!lesson.id) problems.push("lesson.id is required");
  if (!lesson.levels?.length) problems.push("lesson.levels must list at least one level");
  if (!has(lesson.entry)) problems.push(`entry "${lesson.entry}" is not a step`);
  if (!has(lesson.bonusEntry)) problems.push(`bonusEntry "${lesson.bonusEntry}" is not a step`);

  for (const [id, step] of Object.entries(steps)) {
    const where = `step "${id}"`;
    if (!step.text) problems.push(`${where}: text is required`);
    for (const t of targetsOf(step)) if (!has(t)) problems.push(`${where}: target "${t}" is not a step`);
    if (step.choices && !(step.choices in (lesson.choiceSets ?? {}))) problems.push(`${where}: choice set "${step.choices}" is not defined`);
    if (step.choices && (!step.onOk || !step.onWrong)) problems.push(`${where}: choices need onOk and onWrong`);
    if (step.choices) {
      const set = lesson.choiceSets?.[step.choices] ?? [];
      if (!set.some((c) => c.ok)) problems.push(`${where}: choice set "${step.choices}" has no correct choice`);
    }
    if (!step.next && !step.listen && !step.choices && !step.compare && !step.pool) problems.push(`${where}: has no next, listen, choices, compare or pool`);
    if (step.compare && !(step.compare.correct in step.compare.labels)) problems.push(`${where}: compare.correct is not one of the labels`);
    if (step.pool) {
      if (!(step.pool in (lesson.pools ?? {}))) problems.push(`${where}: pool "${step.pool}" is not defined`);
      if (!step.onOk || !step.onWrong) problems.push(`${where}: a pool step needs onOk and onWrong`);
      if (step.onLevelDown && !has(step.onLevelDown)) problems.push(`${where}: onLevelDown "${step.onLevelDown}" is not a step`);
      if (step.askCount !== undefined && (!Number.isInteger(step.askCount) || step.askCount < 1)) problems.push(`${where}: askCount must be a positive integer`);
    }
    problems.push(...visualProblems(step.visual, where));
  }

  const usedPools = new Set(Object.values(steps).map((s) => s.pool).filter(Boolean));
  for (const [concept, levels] of Object.entries(lesson.pools ?? {})) {
    if (!usedPools.has(concept)) problems.push(`pool "${concept}" is never used by a step`);
    if (levels.length > lesson.levels.length) problems.push(`pool "${concept}" has more levels than the lesson`);
    if (!levels[0]?.length) problems.push(`pool "${concept}" needs at least one question at level 1`);
    const ids = new Set<string>();
    levels.forEach((pool, li) =>
      pool.forEach((q) => {
        const where = `pool "${concept}" level ${li + 1} question "${q.id}"`;
        if (!q.id) problems.push(`pool "${concept}" level ${li + 1}: a question has no id`);
        else if (ids.has(q.id)) problems.push(`${where}: duplicate id`);
        ids.add(q.id);
        if (!q.text) problems.push(`${where}: text is required`);
        if (!q.choices?.length) problems.push(`${where}: choices are required`);
        else if (!q.choices.some((c) => c.ok)) problems.push(`${where}: no correct choice`);
        problems.push(...visualProblems(q.visual, where));
      }),
    );
  }
  lesson.explain?.forEach((e, i) => {
    if (typeof e.visual !== "string") problems.push(...visualProblems(e.visual, `explain[${i}]`));
  });

  for (const [kind, r] of Object.entries(lesson.introResponses ?? {})) {
    if (!has(r.go)) problems.push(`introResponses.${kind}: go "${r.go}" is not a step`);
  }
  lesson.progress?.forEach((group, i) => {
    for (const id of group) if (!has(id)) problems.push(`progress[${i}]: "${id}" is not a step`);
  });
  for (const rule of lesson.notes ?? []) {
    for (const cond of rule.when) {
      for (const id of [...(cond.anyOf ?? []), ...(cond.allOf ?? []), ...(cond.noneOf ?? [])]) {
        if (!has(id)) problems.push(`note "${rule.text.slice(0, 20)}…": "${id}" is not a step`);
      }
    }
  }

  // Reachability: END must be reachable from entry; every step should be reachable from entry, bonusEntry or an intro response.
  const reach = (from: string[]) => {
    const seen = new Set<string>();
    const queue = [...from];
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const st = steps[id];
      if (st) queue.push(...targetsOf(st, lesson));
    }
    return seen;
  };
  const fromEntry = reach([lesson.entry]);
  if (!fromEntry.has(END_STEP)) problems.push(`END is not reachable from entry "${lesson.entry}"`);
  const roots = [lesson.entry, lesson.bonusEntry, ...Object.values(lesson.introResponses ?? {}).map((r) => r.go)];
  const reachable = reach(roots);
  for (const id of Object.keys(steps)) if (!reachable.has(id)) problems.push(`step "${id}" is unreachable`);

  return problems;
}
