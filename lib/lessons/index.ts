/**
 * Lesson registry. Add a lesson by dropping its JSON under lib/lessons/<subject>/
 * and listing it here; lessons.test.ts validates every entry (step targets,
 * choice sets, reachability, visuals) so a broken lesson fails the build.
 */
import type { LessonDefinition } from "@/lib/lesson-engine/types";
import fractions from "./math/fractions.lesson.json";
import addsub from "./math/addsub.lesson.json";
import measure from "./math/measure.lesson.json";
import water from "./sci/water.lesson.json";
import senses from "./sci/senses.lesson.json";
import tanween from "./ar/tanween.lesson.json";
import pillars from "./isl/pillars.lesson.json";
import stats8 from "./math/stats8.lesson.json";
import g4math from "./math/g4math.lesson.json";
import g5math from "./math/g5math.lesson.json";
import g4sci from "./sci/g4sci.lesson.json";
import g5ar from "./ar/g5ar.lesson.json";
import g1math from "./math/g1math.lesson.json";
import g1ar from "./ar/g1ar.lesson.json";
import g2math from "./math/g2math.lesson.json";
import g2sci from "./sci/g2sci.lesson.json";
import g6math from "./math/g6math.lesson.json";
import g6sci from "./sci/g6sci.lesson.json";

export const fractionsLesson = fractions as LessonDefinition;
export const addsubLesson = addsub as LessonDefinition;
export const measureLesson = measure as LessonDefinition;
export const waterLesson = water as LessonDefinition;
export const sensesLesson = senses as LessonDefinition;
export const tanweenLesson = tanween as LessonDefinition;
export const pillarsLesson = pillars as LessonDefinition;
export const stats8Lesson = stats8 as LessonDefinition;
export const g4mathLesson = g4math as LessonDefinition;
export const g5mathLesson = g5math as LessonDefinition;
export const g4sciLesson = g4sci as LessonDefinition;
export const g5arLesson = g5ar as LessonDefinition;
export const g1mathLesson = g1math as LessonDefinition;
export const g1arLesson = g1ar as LessonDefinition;
export const g2mathLesson = g2math as LessonDefinition;
export const g2sciLesson = g2sci as LessonDefinition;
export const g6mathLesson = g6math as LessonDefinition;
export const g6sciLesson = g6sci as LessonDefinition;

/** Registered lessons in the order a child meets them (today's lesson is the first unfinished one): subjects alternate so a week touches all four. */
export const LESSON_LIST: LessonDefinition[] = [fractionsLesson, tanweenLesson, waterLesson, pillarsLesson, addsubLesson, sensesLesson, measureLesson, g1mathLesson, g1arLesson, g2mathLesson, g2sciLesson, g4mathLesson, g4sciLesson, g5mathLesson, g5arLesson, g6mathLesson, g6sciLesson, stats8Lesson];

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
