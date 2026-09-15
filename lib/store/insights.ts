/**
 * Read-only views over a child's session history for the home and parent
 * screens. Pure; `now` is injectable for tests.
 */
import type { SessionResult } from "@/lib/lesson-engine/types";
import { minutesLabel, sessionMinutes } from "@/lib/lesson-engine/selectors";

const DAY = 86_400_000;

function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function when(r: SessionResult): number {
  return r.endedAt ?? r.startedAt ?? 0;
}

/** Sessions that ended in the last 7 days (today included). */
export function thisWeek(results: SessionResult[], now = Date.now()): SessionResult[] {
  const from = startOfDay(now) - 6 * DAY;
  return results.filter((r) => when(r) >= from && when(r) <= now + DAY);
}

/** Seven booleans, oldest day first, ending today: did a session happen that day? */
export function streakDays(results: SessionResult[], now = Date.now()): boolean[] {
  const days = new Set(results.map((r) => dayKey(when(r))));
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => days.has(dayKey(today - (6 - i) * DAY)));
}

export interface WeekStats {
  sessions: number;
  minutes: number;
  questions: number;
  correct: number;
}

export function weekStats(results: SessionResult[], now = Date.now()): WeekStats {
  return thisWeek(results, now).reduce<WeekStats>(
    (acc, r) => ({
      sessions: acc.sessions + 1,
      minutes: acc.minutes + sessionMinutes(r.startedAt, r.endedAt, now),
      questions: acc.questions + r.questions,
      correct: acc.correct + r.correct,
    }),
    { sessions: 0, minutes: 0, questions: 0, correct: 0 },
  );
}

/** The most recent session where the level went up, as "lesson title" text; null when none. */
export function bestImprovement(results: SessionResult[], titleOf: (lessonId: string) => string): string | null {
  const r = [...results].reverse().find((x) => x.endDifficulty > x.startDifficulty);
  return r ? titleOf(r.lessonId) : null;
}

/** "اليوم" · "أمس" · "قبل N أيام" · a date for older sessions. */
export function relativeDay(t: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / DAY);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days <= 10) return `قبل ${days} أيام`;
  return new Date(t).toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

export interface SessionRow {
  result: SessionResult;
  title: string;
  meta: string;
  rating: string;
  /** Green when at least two thirds correct. */
  tone: "green" | "amber";
}

/** Newest first. */
export function sessionRows(results: SessionResult[], titleOf: (lessonId: string) => string, now = Date.now()): SessionRow[] {
  return [...results].reverse().map((r) => {
    const mins = sessionMinutes(r.startedAt, r.endedAt, now);
    const ratio = r.questions ? r.correct / r.questions : 0;
    return {
      result: r,
      title: titleOf(r.lessonId),
      meta: `${relativeDay(when(r), now)} · ${minutesLabel(mins)} · ${r.questions} أسئلة`,
      rating: r.rating,
      tone: ratio >= 2 / 3 ? "green" : "amber",
    };
  });
}

/** Lesson ids the child has finished at least once. */
export function completedLessonIds(results: SessionResult[]): Set<string> {
  return new Set(results.map((r) => r.lessonId));
}

export interface LessonMastery {
  lessonId: string;
  sessions: number;
  /** Difficulty the last session ended at (1-based), or null when never played. */
  level: number | null;
  /** Per-concept correct ratio 0–1 across all sessions of this lesson. */
  concepts: Record<string, number>;
  /** Overall correct ratio 0–1 across all sessions of this lesson. */
  ratio: number;
}

/** What the child has shown on one lesson across sessions. */
export function lessonMastery(results: SessionResult[], lessonId: string): LessonMastery {
  const mine = results.filter((r) => r.lessonId === lessonId);
  const tally: Record<string, { asked: number; correct: number }> = {};
  let asked = 0;
  let correct = 0;
  for (const r of mine) {
    asked += r.questions;
    correct += r.correct;
    for (const [c, s] of Object.entries(r.concepts ?? {})) {
      const t = (tally[c] ??= { asked: 0, correct: 0 });
      t.asked += s.asked;
      t.correct += s.correct;
    }
  }
  const concepts = Object.fromEntries(Object.entries(tally).map(([c, t]) => [c, t.asked ? t.correct / t.asked : 0]));
  const last = mine[mine.length - 1];
  return { lessonId, sessions: mine.length, level: last ? last.endDifficulty : null, concepts, ratio: asked ? correct / asked : 0 };
}

/**
 * Level the next session of a lesson starts at: the parent's start level, or
 * where the child's last session of that lesson ended, whichever is higher.
 */
export function continueLevel(results: SessionResult[], lessonId: string, startLevel: number): number {
  const last = [...results].reverse().find((r) => r.lessonId === lessonId);
  return Math.max(startLevel, last?.endDifficulty ?? 1);
}
