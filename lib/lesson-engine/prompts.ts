/**
 * Prompt builders for the (future) live model. The state machine decides the
 * next step; the model is asked only to assess the child's utterance and to
 * phrase the teacher's line, returning the structured `ModelTurn` contract.
 */
import type { LessonDefinition } from "./types";
import type { TurnState } from "./contract";
import { VISUAL_IDS } from "./contract";

export function systemPrompt(lesson: LessonDefinition, childName: string): string {
  return [
    `أنت ${lesson.teacher}، معلم ابتدائي هادئ يشرح بالعربية (لهجة سعودية بسيطة) لطفل اسمه ${childName}.`,
    `الدرس: ${lesson.title} (${lesson.subject}).`,
    "اشرح بجمل قصيرة وأمثلة من حياة الطفل (بيتزا، شوكولاتة). لا تنتقد. شجّع دائمًا.",
    "لا تخرج عن خطوة الدرس الحالية. لا تقفز لمفاهيم جديدة.",
    "أعد دائمًا JSON فقط بهذا الشكل:",
    JSON.stringify(
      {
        assessment: "understood|confused|wrong|strong",
        next_action: "continue|re_explain|different_example|retry|increase_difficulty",
        difficulty_change: -1,
        teaching_strategy: "concrete_visual_example",
        visual: VISUAL_IDS.join("|"),
        response: "خلنا نجربها بطريقة ثانية...",
      },
      null,
      2,
    ),
  ].join("\n");
}

export function turnPrompt(turn: TurnState, teacherLine: string, childUtterance: string): string {
  return [
    "حالة الجلسة:",
    JSON.stringify(turn, null, 2),
    `قال المعلم: "${teacherLine}"`,
    `قال الطفل: "${childUtterance}"`,
    "قيّم إجابة الطفل واقترح الخطوة التالية بصيغة JSON فقط.",
  ].join("\n");
}
