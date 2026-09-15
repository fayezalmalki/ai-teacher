/**
 * Lesson engine types.
 *
 * The engine is a small deterministic state machine that wraps the (future)
 * LLM. Lesson content lives in JSON under lib/lessons/; the reducer
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

/** Parametric visual: what to draw, with its props. See visuals.ts for the id aliases. */
export type VisualSpec =
  | { kind: "pizza"; filled: 0 | 1 | 2 | 3 | 4; dividers: "none" | "v" | "vh" }
  | { kind: "fractions"; pairs: { n: string; d: string }[] }
  | { kind: "chocolate"; mode: "one" | "two" | "pick" }
  | { kind: "compare"; pick?: boolean }
  /** Place-value blocks for a number up to 999; `highlight` tints one place. */
  | { kind: "blocks"; value: number; highlight?: "hundreds" | "tens" | "ones" }
  /** Number line from..to; `start` marks a point and `jump` draws an arc of that size from it. */
  | { kind: "numberline"; from: number; to: number; step?: number; start?: number; jump?: number }
  /** A ruler in centimetres with an object of `length` laid on it. */
  | { kind: "ruler"; length: number; max?: number; label?: string }
  /** A balance scale; the heavier pan drops. */
  | { kind: "balance"; left: number; right: number; leftLabel?: string; rightLabel?: string }
  /** A cycle of stages drawn in a ring; `highlight` fills one. */
  | { kind: "cycle"; stages: string[]; highlight?: number }
  /** One big word (reading); `marks` lists character indexes to tint, `caption` sits under it. */
  | { kind: "word"; text: string; marks?: number[]; caption?: string }
  /** A row of cards (words or items); `highlight` fills one, `numbered` prefixes 1, 2, 3… */
  | { kind: "cards"; items: { label: string; icon?: string; sub?: string }[]; highlight?: number; numbered?: boolean }
  /** Bar chart (histogram) of categories; `highlight` fills some bars. */
  | { kind: "chart"; type: "bar"; categories: string[]; values: number[]; highlight?: number[]; xLabel?: string; yLabel?: string }
  /** Pie chart of percentage slices; `highlight` lifts one. */
  | { kind: "chart"; type: "pie"; slices: { label: string; value: number }[]; highlight?: number }
  /** Box-and-whisker plot on a numeric axis; `highlight` tints one part. */
  | { kind: "chart"; type: "box"; min: number; q1: number; median: number; q3: number; max: number; from?: number; to?: number; label?: string; highlight?: "left" | "box" | "right" | "median" }
  /** A small table; `highlight` tints one row. */
  | { kind: "table"; head: string[]; rows: string[][]; highlight?: number }
  | { kind: "none" };

/** A step's visual: a spec, or one of the fractions-era ids. */
export type VisualRef = VisualId | VisualSpec;

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

/** One question in a level pool. Drawn by a pool step at the session's current difficulty. */
export interface PoolQuestion {
  id: string;
  /** Teacher line. `{name}` is replaced with the child's name. */
  text: string;
  visual: VisualRef;
  choices: Choice[];
  wrongLog?: string;
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
  visual: VisualRef;
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
  /**
   * Pool step: on entry the engine draws a question for this concept from
   * `lesson.pools[pool][difficulty - 1]`; answers apply the adaptation policy.
   */
  pool?: string;
  /** Where to go when the policy lowers the level (defaults to onWrong). */
  onLevelDown?: string;
  /** Pool step: correct answers needed before onOk is taken (default 1); until then it re-draws. */
  askCount?: number;
  /** Choices of the drawn pool question (set on the resolved step only). */
  inlineChoices?: Choice[];
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
  visual: ExplainVisualId | VisualSpec;
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
  /** Template for the level-down adaptation chip, `{level}` placeholder. */
  levelDownAdapt?: string;
  /** Question pools per concept; outer index = level - 1. Read by pool steps. */
  pools?: Record<string, PoolQuestion[][]>;
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
  /** Correct answers in a row (reset on a wrong answer). Read by the adaptation policy. */
  correctStreak: number;
  /** Wrong answers in a row (reset on a correct answer). */
  wrongStreak: number;
  /** Difficulty the session started at (the parent's start level, or where the last session ended). */
  startDifficulty: number;
  /** Id of the pool question drawn for the current pool step. */
  poolQuestion: string | null;
  /** Pool question ids already asked this session (no repeats while others remain). */
  asked: string[];
  /** Per-concept tally of counted answers, for mastery. */
  concepts: Record<string, ConceptStat>;
  /** Correct answers given at each pool step this session (for askCount). */
  poolCorrect: Record<string, number>;
}

export interface ConceptStat {
  asked: number;
  correct: number;
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
  /** Adaptation thresholds and start level; defaults apply when omitted. */
  policy?: Partial<import("./policy").AdaptationPolicy>;
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
  /** Per-concept tally, for the child's mastery across sessions. */
  concepts?: Record<string, ConceptStat>;
}
