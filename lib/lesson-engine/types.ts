/**
 * Lesson engine types.
 *
 * The engine is a small deterministic state machine that wraps the (future)
 * LLM. Lesson content lives in JSON (see fractions.lesson.json); the reducer
 * in reducer.ts walks the step graph and keeps the per-turn state that the
 * UI, the end screen, the parent summary and analytics all read from.
 */

export type VisualId =
  | "pizzaHalf"
  | "pizza34"
  | "fractions"
  | "fractions34"
  | "chocOne"
  | "chocPick"
  | "chocTwo"
  | "compare"
  | "comparePick";

export type ExplainVisualId = "whole" | "half" | "quarter" | "glyph";

export type Mood = "neutral" | "encourage";

export type Understanding =
  | "unknown"
  | "good"
  | "partial"
  | "unclear"
  | "confused"
  | "strong";

export type Phase = "speaking" | "listening" | "thinking" | "choosing" | "idle";

export type Screen = "start" | "lesson" | "end" | "ask" | "summary";

/** Special step ids that leave the step graph. */
export const END_STEP = "END";
export const SUMMARY_STEP = "SUMMARY";

export interface Choice {
  /** Button label. */
  l: string;
  /** Optional machine value (used by the compare visual). */
  v?: string;
  /** Whether this choice is the correct one. */
  ok?: boolean;
}

export interface CompareSpec {
  /** Value of the correct circle. */
  correct: string;
  onOk: string;
  onWrong: string;
  /** Transcript template with `{name}` and `{choice}` placeholders. */
  transcript: string;
  /** Labels for the two circles keyed by value. */
  labels: Record<string, string>;
}

export interface LessonStep {
  /** Teacher line. `{name}` is replaced with the child's name. */
  text: string;
  visual: VisualId;
  /** Concept the step teaches (for the engine-state contract). */
  concept: string;
  /** Intro step: wait for a free-form (voice) answer. */
  listen?: boolean;
  /** Auto-advance to this step after speaking (+ pause). */
  next?: string;
  /** Name of a choice set in `choiceSets`. */
  choices?: string;
  onOk?: string;
  onWrong?: string;
  /** Counts toward questions asked. */
  question?: boolean;
  /** Log line appended when the child answers wrongly here. */
  wrongLog?: string;
  /** Log line appended when the step is entered. */
  log?: string;
  mood?: Mood;
  /** Raise difficulty by one on entry. */
  levelUp?: boolean;
  /** Set the teaching strategy on entry. */
  strategy?: string;
  /** Adaptation chip text shown under the visual. */
  adapt?: string;
  /** Retry of the previous question (does not count as a new question). */
  retry?: boolean;
  /** Counts as a re-explanation for the summary. */
  reexplain?: boolean;
  /** A deliberately simpler question. */
  simpler?: boolean;
  /** Tappable two-circle comparison question. */
  compare?: CompareSpec;
}

export type IntroAnswerKind = "correct" | "unclear" | "dontknow" | "strong";

export interface IntroResponse {
  /** Simulated child transcript. */
  transcript: string;
  understanding: Understanding;
  go: string;
  log: string;
  questions: number;
  correct: number;
}

export interface NoteCondition {
  anyOf?: string[];
  allOf?: string[];
  noneOf?: string[];
}

export interface NoteRule {
  text: string;
  /** Any matching condition group activates the note. */
  when: NoteCondition[];
  /** Rules sharing a group are mutually exclusive: first match wins. */
  group?: string;
}

export interface RatingRule {
  min: number;
  label: string;
}

export interface ExplainStep {
  text: string;
  visual: ExplainVisualId;
}

export interface LessonDefinition {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  teacher: string;
  durationLabel: string;
  /** Difficulty level labels, index = difficulty - 1. */
  levels: string[];
  /** Template for the level-up adaptation chip, `{level}` placeholder. */
  levelUpAdapt: string;
  entry: string;
  bonusEntry: string;
  choiceSets: Record<string, Choice[]>;
  steps: Record<string, LessonStep>;
  introResponses: Record<IntroAnswerKind, IntroResponse>;
  /** Transcript template for a tapped choice (`{name}`, `{choice}`). */
  choiceTranscript: string;
  /** Progress dots: each dot is done when any listed step was visited. `END` = end screen reached. */
  progress: string[][];
  notes: NoteRule[];
  rating: RatingRule[];
  endLine: string;
  /** Open conversation ("ask the teacher") copy. */
  ask: {
    cta: string;
    title: string;
    greeting: string;
    hint: string;
    done: string;
    unavailable: string;
    /** Topics the live model may discuss; everything else is redirected. */
    scope: string;
  };
  /** Parent-summary log line appended when the child used the open conversation. */
  askLog: string;
  thinkingLabel: string;
  thinkingRetryLabel: string;
  explain: ExplainStep[];
  intro: {
    eyebrow: string;
    title: string;
    line: string;
  };
}

/** One exchange in the open "ask the teacher" conversation. */
export interface AskTurn {
  question: string;
  answer: string;
}

export interface PendingGoto {
  id: string;
  extra?: Partial<SessionState>;
}

/** Client-side mirror of the session. Server-side state (route handler / WS) mirrors this shape. */
export interface SessionState {
  screen: Screen;
  step: string;
  phase: Phase;
  transcript: string;
  /** Selected chocolate squares (chocPick visual). */
  selected: number[];
  /** Human-readable adaptation log. */
  log: string[];
  visited: string[];
  difficulty: number;
  strategy: string;
  understanding: Understanding;
  questions: number;
  correct: number;
  reexplain: number;
  adapt: string | null;
  startedAt: number | null;
  endedAt: number | null;
  recording: boolean;
  /** Where to go once "thinking" ends. */
  pending: PendingGoto | null;
  /** Open-conversation exchanges (Gemini Live), shown to parents. */
  askTurns: AskTurn[];
}

export type DemoPath = "understands" | "confused" | "wrong" | "strong";

export type SessionAction =
  | { type: "START"; now: number }
  | { type: "GOTO"; id: string; extra?: Partial<SessionState> }
  | { type: "SPEECH_END" }
  | { type: "MIC_START" }
  | { type: "MIC_STOP" }
  | { type: "INTRO_ANSWER"; kind: IntroAnswerKind; transcript?: string }
  | { type: "PICK"; index: number }
  | { type: "PICK_COMPARE"; value: string }
  | { type: "TOGGLE_SQUARE"; index: number }
  | { type: "THINK_END" }
  | { type: "BONUS" }
  | { type: "ASK_OPEN" }
  | { type: "ASK_TURN"; question: string; answer: string }
  | { type: "ASK_CLOSE" }
  | { type: "FINISH"; now: number }
  | { type: "RESTART" }
  | { type: "DEMO"; path: DemoPath };

export interface EngineContext {
  lesson: LessonDefinition;
  /** Child's name for `{name}` templating. */
  name: string;
}

/** What the runtime should do once the teacher finishes speaking. */
export type AfterSpeech =
  | { kind: "pause"; next: string }
  | { kind: "await"; phase: "listening" | "choosing" };

/** A stat tile on the summary screen. */
export interface StatTile {
  k: string;
  v: string | number;
}

/** Persisted result of a finished session (read by the summary page and the parent area). */
export interface SessionResult {
  lessonId: string;
  childName: string;
  startedAt: number | null;
  endedAt: number | null;
  questions: number;
  correct: number;
  reexplain: number;
  startDifficulty: number;
  endDifficulty: number;
  log: string[];
  visited: string[];
  rating: string;
  askTurns: AskTurn[];
}
