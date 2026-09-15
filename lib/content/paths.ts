/**
 * Lesson paths per subject with the status a given child sees. Registered
 * lessons take their status from the child's history; the placeholder titles
 * from the catalog keep their scripted status until they are built.
 */
import type { SessionResult } from "@/lib/lesson-engine/types";
import { LESSON_LIST, lessons } from "@/lib/lessons";
import { completedLessonIds } from "@/lib/store/insights";
import { LESSONS, type LessonEntry } from "./catalog";

export function subjectLessons(subjectId: string, results: SessionResult[]): LessonEntry[] {
  const done = completedLessonIds(results);
  const today = todaysLesson(results);
  const entries = LESSONS[subjectId] ?? [];
  return entries.map((e) => {
    if (!e.lessonId || !lessons[e.lessonId]) return e;
    if (done.has(e.lessonId)) return { ...e, status: "done" };
    return { ...e, status: today && today.lessonId === e.lessonId && !today.done ? "today" : "next" };
  });
}

/** The lesson the child home offers: the first registered lesson (registry order) not yet finished, else the last one finished. */
export function todaysLesson(results: SessionResult[]): { lessonId: string; subjectId: string; done: boolean } | null {
  const done = completedLessonIds(results);
  const next = LESSON_LIST.find((l) => !done.has(l.id));
  if (next) return { lessonId: next.id, subjectId: next.subjectId, done: false };
  const last = LESSON_LIST[LESSON_LIST.length - 1];
  return last ? { lessonId: last.id, subjectId: last.subjectId, done: true } : null;
}

/** Lessons finished per subject over the subject's path length, 0–100. */
export function subjectPercent(subjectId: string, results: SessionResult[]): number {
  const entries = LESSONS[subjectId] ?? [];
  if (!entries.length) return 0;
  const done = completedLessonIds(results);
  const finished = entries.filter((e) => e.lessonId && done.has(e.lessonId)).length;
  return Math.round((finished / entries.length) * 100);
}
