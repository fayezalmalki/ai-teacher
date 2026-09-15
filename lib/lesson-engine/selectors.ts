import type {
  LessonDefinition,
  LessonStep,
  NoteCondition,
  PoolQuestion,
  SessionResult,
  SessionState,
  StatTile,
} from "./types";
import { fill } from "./template";
import { getStep } from "./reducer";

/** The pool question drawn for a pool step, if any. */
export function drawnQuestion(state: SessionState, lesson: LessonDefinition, step: LessonStep): PoolQuestion | null {
  if (!step.pool || !state.poolQuestion) return null;
  for (const level of lesson.pools?.[step.pool] ?? []) {
    const q = level.find((x) => x.id === state.poolQuestion);
    if (q) return q;
  }
  return null;
}

/** The current step with the drawn pool question merged in (text, visual, choices). */
export function currentStep(state: SessionState, lesson: LessonDefinition): LessonStep {
  const raw = lesson.steps[state.step] ?? getStep(lesson, lesson.entry);
  const q = drawnQuestion(state, lesson, raw);
  if (!q) return raw;
  return { ...raw, text: q.text, visual: q.visual, inlineChoices: q.choices, question: true, wrongLog: q.wrongLog ?? raw.wrongLog };
}

/** Teacher line with the child's name filled in. */
export function teacherLine(state: SessionState, lesson: LessonDefinition, name: string): string {
  return fill(currentStep(state, lesson).text, { name });
}

/** The 5 header progress dots. */
export function progressDots(state: SessionState, lesson: LessonDefinition): boolean[] {
  const ended = state.screen === "end" || state.screen === "summary";
  return lesson.progress.map((group) =>
    group.some((id) => (id === "END" ? ended : state.visited.includes(id))),
  );
}

function matches(cond: NoteCondition, visited: string[]): boolean {
  if (cond.anyOf && !cond.anyOf.some((id) => visited.includes(id))) return false;
  if (cond.allOf && !cond.allOf.every((id) => visited.includes(id))) return false;
  if (cond.noneOf && cond.noneOf.some((id) => visited.includes(id))) return false;
  return true;
}

/** "لاحظت أنك:" bullets derived from the path the child took. */
export function observationNotes(visited: string[], lesson: LessonDefinition): string[] {
  const out: string[] = [];
  const usedGroups = new Set<string>();
  for (const rule of lesson.notes) {
    if (rule.group && usedGroups.has(rule.group)) continue;
    if (rule.when.some((c) => matches(c, visited))) {
      out.push(rule.text);
      if (rule.group) usedGroups.add(rule.group);
    }
  }
  return out;
}

export function ratingLabel(questions: number, correct: number, lesson: LessonDefinition): string {
  const ratio = questions ? correct / questions : 0;
  const rule = lesson.rating.find((r) => ratio >= r.min) ?? lesson.rating[lesson.rating.length - 1];
  return rule.label;
}

export function sessionMinutes(startedAt: number | null, endedAt: number | null, now = Date.now()): number {
  if (!startedAt) return 1;
  return Math.max(1, Math.round(((endedAt ?? now) - startedAt) / 60000));
}

/** Arabic number agreement: 1 دقيقة · 2 دقيقتان · 3–10 دقائق · 11+ دقيقة. */
export function minutesLabel(mins: number): string {
  if (mins === 1) return "دقيقة واحدة";
  if (mins === 2) return "دقيقتان";
  return mins + (mins > 10 ? " دقيقة" : " دقائق");
}

export function summaryStats(result: SessionResult, lesson: LessonDefinition): StatTile[] {
  const mins = sessionMinutes(result.startedAt, result.endedAt);
  return [
    { k: "مدة الجلسة", v: minutesLabel(mins) },
    { k: "الأسئلة", v: result.questions },
    { k: "الإجابات الصحيحة", v: result.correct },
    { k: "مرات إعادة الشرح", v: result.reexplain },
    { k: "مستوى البداية", v: lesson.levels[result.startDifficulty - 1] },
    { k: "مستوى النهاية", v: lesson.levels[result.endDifficulty - 1] },
  ];
}

export function toSessionResult(state: SessionState, lesson: LessonDefinition, childName: string): SessionResult {
  return {
    lessonId: lesson.id,
    childName,
    startedAt: state.startedAt,
    endedAt: state.endedAt ?? Date.now(),
    questions: state.questions,
    correct: state.correct,
    reexplain: state.reexplain,
    startDifficulty: state.startDifficulty,
    endDifficulty: state.difficulty,
    log: state.log,
    visited: state.visited,
    rating: ratingLabel(state.questions, state.correct, lesson),
    concepts: state.concepts,
    askTurns: state.askTurns,
  };
}

export function thinkingLabel(state: SessionState, lesson: LessonDefinition): string {
  return currentStep(state, lesson).retry ? lesson.thinkingRetryLabel : lesson.thinkingLabel;
}
