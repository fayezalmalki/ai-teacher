/**
 * JSON contracts between the UI, the state machine and the model.
 *
 * `TurnState` is what we send the model each turn; `ModelTurn` is the
 * structured output we require back. The state machine stays in charge of
 * which step comes next; the model only assesses and phrases.
 */
import type { LessonDefinition, SessionState, Understanding, VisualId } from "./types";
import { currentStep } from "./selectors";

export type Assessment = "understood" | "confused" | "wrong" | "strong";
export type NextAction = "continue" | "re_explain" | "different_example" | "retry" | "increase_difficulty";

export const VISUAL_IDS: VisualId[] = [
  "pizzaHalf",
  "pizza34",
  "fractions",
  "fractions34",
  "chocOne",
  "chocPick",
  "chocTwo",
  "compare",
  "comparePick",
];

const ASSESSMENTS: Assessment[] = ["understood", "confused", "wrong", "strong"];
const NEXT_ACTIONS: NextAction[] = ["continue", "re_explain", "different_example", "retry", "increase_difficulty"];

/** Session state per turn (sent to the model). */
export interface TurnState {
  concept: string;
  difficulty: number;
  attempts: number;
  understanding: Understanding;
  previous_strategy: string;
  next_strategy: string;
}

/** Model output contract (structured). */
export interface ModelTurn {
  assessment: Assessment;
  next_action: NextAction;
  difficulty_change: -1 | 0 | 1;
  teaching_strategy: string;
  visual: VisualId;
  response: string;
}

export function toTurnState(state: SessionState, lesson: LessonDefinition): TurnState {
  const step = currentStep(state, lesson);
  return {
    concept: step.concept,
    difficulty: state.difficulty,
    attempts: state.questions,
    understanding: state.understanding,
    previous_strategy: state.strategy,
    next_strategy: step.strategy ?? state.strategy,
  };
}

/** Engine-state JSON shown in the demo panel. */
export function engineStateJson(state: SessionState, lesson: LessonDefinition): string {
  const step = currentStep(state, lesson);
  return JSON.stringify(
    {
      concept: step.concept,
      difficulty: state.difficulty,
      attempts: state.questions,
      understanding: state.understanding,
      strategy: state.strategy,
      phase: state.phase,
    },
    null,
    2,
  );
}

export class ModelTurnError extends Error {}

/** Validate a raw model output against the contract. Throws ModelTurnError. */
export function parseModelTurn(raw: unknown): ModelTurn {
  const obj = typeof raw === "string" ? safeJson(raw) : raw;
  if (!obj || typeof obj !== "object") throw new ModelTurnError("model output is not an object");
  const o = obj as Record<string, unknown>;
  const assessment = o.assessment as Assessment;
  if (!ASSESSMENTS.includes(assessment)) throw new ModelTurnError(`bad assessment: ${String(o.assessment)}`);
  const next_action = o.next_action as NextAction;
  if (!NEXT_ACTIONS.includes(next_action)) throw new ModelTurnError(`bad next_action: ${String(o.next_action)}`);
  const dc = Number(o.difficulty_change ?? 0);
  if (![-1, 0, 1].includes(dc)) throw new ModelTurnError(`bad difficulty_change: ${String(o.difficulty_change)}`);
  const visual = o.visual as VisualId;
  if (!VISUAL_IDS.includes(visual)) throw new ModelTurnError(`bad visual: ${String(o.visual)}`);
  if (typeof o.response !== "string" || !o.response.trim()) throw new ModelTurnError("missing response");
  return {
    assessment,
    next_action,
    difficulty_change: dc as -1 | 0 | 1,
    teaching_strategy: typeof o.teaching_strategy === "string" ? o.teaching_strategy : "",
    visual,
    response: o.response,
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ModelTurnError("model output is not valid JSON");
  }
}
