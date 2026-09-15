/**
 * Lesson paths per subject with the status a given child sees. Registered
 * lessons take their status from the child's history; the placeholder titles
 * from the catalog keep their scripted status until they are built.
 */
import type { SessionResult } from "@/lib/lesson-engine/types";
import { lessons } from "@/lib/lessons";
import { completedLessonIds } from "@/lib/store/insights";
import { LESSONS, type LessonEntry } from "./catalog";

export function subjectLessons(subjectId: string, results: SessionResult[]): LessonEntry[] {
  const done = completedLessonIds(results);
  const entries = LESSONS[subjectId] ?? [];
  let todayAssigned = false;
  return entries.map((e) => {
    if (!e.lessonId || !lessons[e.lessonId]) return e;
    if (done.has(e.lessonId)) return { ...e, status: "done" };
    if (!todayAssigned) {
      todayAssigned = true;
      return { ...e, status: "today" };
    }
    return { ...e, status: "next" };
  });
}

/** The lesson the child home offers: the first registered lesson not yet finished, else the last one finished. */
export function todaysLesson(results: SessionResult[]): { lessonId: string; subjectId: string; done: boolean } | null {
  const done = completedLessonIds(results);
  let last: { lessonId: string; subjectId: string } | null = null;
  for (const [subjectId, entries] of Object.entries(LESSONS)) {
    for (const e of entries) {
      if (!e.lessonId || !lessons[e.lessonId]) continue;
      if (!done.has(e.lessonId)) return { lessonId: e.lessonId, subjectId, done: false };
      last = { lessonId: e.lessonId, subjectId };
    }
  }
  return last ? { ...last, done: true } : null;
}

/** Lessons finished per subject over the subject's path length, 0–100. */
export function subjectPercent(subjectId: string, results: SessionResult[]): number {
  const entries = LESSONS[subjectId] ?? [];
  if (!entries.length) return 0;
  const done = completedLessonIds(results);
  const finished = entries.filter((e) => e.lessonId && done.has(e.lessonId)).length;
  return Math.round((finished / entries.length) * 100);
}
