import fractions from "./fractions.lesson.json";
import type { LessonDefinition } from "./types";

export const fractionsLesson = fractions as LessonDefinition;

export const lessons: Record<string, LessonDefinition> = {
  [fractionsLesson.id]: fractionsLesson,
};

export function getLesson(id: string): LessonDefinition | undefined {
  return lessons[id];
}

export * from "./types";
export * from "./reducer";
export * from "./selectors";
export * from "./contract";
export * from "./timing";
export { fill } from "./template";
