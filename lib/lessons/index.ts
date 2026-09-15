/**
 * Lesson registry. Add a lesson by dropping its JSON under lib/lessons/<subject>/
 * and listing it here; lessons.test.ts validates every entry (step targets,
 * choice sets, reachability, visuals) so a broken lesson fails the build.
 */
import type { LessonDefinition } from "@/lib/lesson-engine/types";
import fractions from "./math/fractions.lesson.json";

export const fractionsLesson = fractions as LessonDefinition;

/** Registered lessons in catalog order. */
export const LESSON_LIST: LessonDefinition[] = [fractionsLesson];

export const lessons: Record<string, LessonDefinition> = Object.fromEntries(LESSON_LIST.map((l) => [l.id, l]));

export function getLesson(id: string): LessonDefinition | undefined {
  return lessons[id];
}

/** Lessons of one subject, in registry order. */
export function lessonsForSubject(subjectId: string): LessonDefinition[] {
  return LESSON_LIST.filter((l) => l.subjectId === subjectId);
}

/** Lesson title for summaries; falls back to the id for lessons that no longer exist. */
export function lessonTitle(id: string): string {
  return lessons[id]?.title ?? id;
}
