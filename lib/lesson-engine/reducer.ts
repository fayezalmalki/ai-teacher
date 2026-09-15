import {
  END_STEP,
  SUMMARY_STEP,
  type AfterSpeech,
  type Choice,
  type DemoPath,
  type EngineContext,
  type ConceptStat,
  type IntroAnswerKind,
  type LessonDefinition,
  type LessonStep,
  type PoolQuestion,
  type SessionAction,
  type SessionState,
} from "./types";
import { fill } from "./template";
import { clampLevel, resolvePolicy } from "./policy";
import { currentStep } from "./selectors";

export const initialSessionState: SessionState = {
  screen: "start",
  step: "intro",
  phase: "speaking",
  transcript: "",
  selected: [],
  log: [],
  visited: [],
  difficulty: 1,
  strategy: "pizza_visual",
  understanding: "unknown",
  questions: 0,
  correct: 0,
  reexplain: 0,
  adapt: null,
  startedAt: null,
  endedAt: null,
  recording: false,
  pending: null,
  askTurns: [],
  correctStreak: 0,
  wrongStreak: 0,
  startDifficulty: 1,
  poolQuestion: null,
  asked: [],
  concepts: {},
  poolCorrect: {},
};

export function createInitialState(lesson: LessonDefinition, ctx?: Pick<EngineContext, "policy">): SessionState {
  const policy = resolvePolicy(ctx?.policy);
  const difficulty = clampLevel(policy.startLevel, lesson.levels.length, policy);
  return { ...initialSessionState, step: lesson.entry, difficulty, startDifficulty: difficulty };
}

export function getStep(lesson: LessonDefinition, id: string): LessonStep {
  const step = lesson.steps[id];
  if (!step) throw new Error(`Unknown lesson step: ${id}`);
  return step;
}

export function getChoices(lesson: LessonDefinition, step: LessonStep): Choice[] {
  if (step.inlineChoices) return step.inlineChoices;
  if (!step.choices) return [];
  return lesson.choiceSets[step.choices] ?? [];
}

/**
 * Draw a question for a pool step at the current level: the first one not yet
 * asked this session, falling back to the nearest lower level with questions,
 * then to repeating the level's first question.
 */
export function drawPoolQuestion(lesson: LessonDefinition, concept: string, difficulty: number, asked: string[]): PoolQuestion | null {
  const levels = lesson.pools?.[concept] ?? [];
  for (let level = Math.min(difficulty, levels.length); level >= 1; level--) {
    const pool = levels[level - 1] ?? [];
    if (!pool.length) continue;
    return pool.find((q) => !asked.includes(q.id)) ?? pool[0];
  }
  return null;
}

function vars(ctx: EngineContext, extra: Record<string, string> = {}) {
  return { name: ctx.name, ...extra };
}

/** Enter a step (or END / SUMMARY). Pure. */
export function goto(
  state: SessionState,
  ctx: EngineContext,
  id: string,
  extra: Partial<SessionState> = {},
): SessionState {
  if (id === END_STEP) {
    return { ...state, ...extra, screen: "end", phase: "idle", adapt: null, pending: null, recording: false };
  }
  if (id === SUMMARY_STEP) {
    return {
      ...state,
      ...extra,
      screen: "summary",
      phase: "idle",
      adapt: null,
      pending: null,
      recording: false,
      endedAt: state.endedAt ?? Date.now(),
    };
  }
  const { lesson } = ctx;
  const st = getStep(lesson, id);
  const next: SessionState = {
    ...state,
    step: id,
    phase: "speaking",
    transcript: "",
    selected: [],
    visited: [...state.visited, id],
    adapt: st.adapt ?? null,
    recording: false,
    pending: null,
    ...extra,
  };
  if (st.levelUp) {
    const policy = resolvePolicy(ctx.policy);
    next.difficulty = clampLevel(state.difficulty + 1, lesson.levels.length, policy);
    if (next.difficulty !== state.difficulty) next.adapt = fill(lesson.levelUpAdapt, { level: lesson.levels[next.difficulty - 1] });
  }
  if (st.strategy) next.strategy = st.strategy;
  if (st.retry || st.reexplain) next.reexplain = state.reexplain + 1;
  if (st.log) next.log = [...(extra.log ?? state.log), fill(st.log, vars(ctx))];
  next.poolQuestion = null;
  if (st.pool) {
    const q = drawPoolQuestion(lesson, st.pool, next.difficulty, next.asked);
    if (q) {
      next.poolQuestion = q.id;
      next.asked = next.asked.includes(q.id) ? next.asked : [...next.asked, q.id];
    }
  }
  return next;
}

/** Tally a counted answer against the step's concept. */
function tally(state: SessionState, concept: string, ok: boolean): Record<string, ConceptStat> {
  const prev = state.concepts[concept] ?? { asked: 0, correct: 0 };
  return { ...state.concepts, [concept]: { asked: prev.asked + 1, correct: prev.correct + (ok ? 1 : 0) } };
}

/**
 * On pool steps the adaptation policy decides the level: a run of correct
 * answers raises it (with the level-up note), a run of wrong ones lowers it and
 * routes to the step's onLevelDown. Returns the state patch and the target.
 */
function applyPolicy(
  state: SessionState,
  ctx: EngineContext,
  st: LessonStep,
  ok: boolean,
  streak: Pick<SessionState, "correctStreak" | "wrongStreak">,
): { extra: Partial<SessionState>; target: string | undefined } {
  let target = ok ? st.onOk : st.onWrong;
  if (!st.pool) return { extra: {}, target };
  const { lesson } = ctx;
  const policy = resolvePolicy(ctx.policy);
  const top = clampLevel(lesson.levels.length, lesson.levels.length, policy);
  const extra: Partial<SessionState> = {};
  if (ok) {
    // Keep drawing from this pool until the step's askCount is met.
    const done = (state.poolCorrect[state.step] ?? 0) + 1;
    extra.poolCorrect = { ...state.poolCorrect, [state.step]: done };
    if (done < (st.askCount ?? 1)) target = state.step;
  }
  if (ok && streak.correctStreak >= policy.levelUpAfterCorrect && state.difficulty < top) {
    const difficulty = state.difficulty + 1;
    const note = fill(lesson.levelUpAdapt, { level: lesson.levels[difficulty - 1] });
    return { extra: { ...extra, difficulty, adapt: note, correctStreak: 0, log: [...state.log, note] }, target };
  }
  if (!ok && streak.wrongStreak >= policy.levelDownAfterWrong && state.difficulty > 1) {
    const difficulty = state.difficulty - 1;
    const note = fill(lesson.levelDownAdapt ?? lesson.levelUpAdapt, { level: lesson.levels[difficulty - 1] });
    return { extra: { ...extra, difficulty, adapt: note, wrongStreak: 0, log: [...state.log, note] }, target: st.onLevelDown ?? st.onWrong };
  }
  return { extra, target };
}

/** Move to "thinking" and remember where to go afterwards. */
function think(
  state: SessionState,
  transcript: string,
  id: string,
  extra: Partial<SessionState> = {},
): SessionState {
  return { ...state, phase: "thinking", transcript, recording: false, pending: { id, extra } };
}

function answerIntro(state: SessionState, ctx: EngineContext, kind: IntroAnswerKind, transcript?: string): SessionState {
  const r = ctx.lesson.introResponses[kind];
  const counted = r.questions > 0;
  const ok = r.correct > 0;
  const st = currentStep(state, ctx.lesson);
  return think(state, transcript?.trim() || r.transcript, r.go, {
    understanding: r.understanding,
    questions: state.questions + r.questions,
    correct: state.correct + r.correct,
    log: [...state.log, fill(r.log, vars(ctx))],
    ...(counted ? { ...streaks(state, ok), concepts: tally(state, st.concept, ok) } : {}),
  });
}

/** Streak counters after an answer that counts. */
function streaks(state: SessionState, ok: boolean): Pick<SessionState, "correctStreak" | "wrongStreak"> {
  return ok
    ? { correctStreak: state.correctStreak + 1, wrongStreak: 0 }
    : { correctStreak: 0, wrongStreak: state.wrongStreak + 1 };
}

function pick(state: SessionState, ctx: EngineContext, choice: Choice): SessionState {
  const st = currentStep(state, ctx.lesson);
  const ok = !!choice.ok;
  const streak = streaks(state, ok);
  const extra: Partial<SessionState> = {
    questions: state.questions + (st.retry ? 0 : 1),
    correct: state.correct + (ok ? 1 : 0),
    understanding: ok ? "good" : "partial",
    concepts: tally(state, st.concept, ok),
    ...streak,
  };
  if (!ok && st.wrongLog) extra.log = [...state.log, fill(st.wrongLog, vars(ctx))];
  const policy = applyPolicy({ ...state, log: extra.log ?? state.log }, ctx, st, ok, streak);
  Object.assign(extra, policy.extra);
  if (!policy.target) return state;
  return think(state, fill(ctx.lesson.choiceTranscript, vars(ctx, { choice: choice.l })), policy.target, extra);
}

function pickCompare(state: SessionState, ctx: EngineContext, value: string): SessionState {
  const st = getStep(ctx.lesson, state.step);
  if (!st.compare) return state;
  const ok = value === st.compare.correct;
  const extra: Partial<SessionState> = {
    questions: state.questions + (st.retry ? 0 : 1),
    correct: state.correct + (ok ? 1 : 0),
    understanding: ok ? "good" : "partial",
    concepts: tally(state, st.concept, ok),
    ...streaks(state, ok),
  };
  const label = st.compare.labels[value] ?? value;
  return think(
    state,
    fill(st.compare.transcript, vars(ctx, { choice: label })),
    ok ? st.compare.onOk : st.compare.onWrong,
    extra,
  );
}

/** True while the teacher waits for the child (mic, choices or a tappable visual). */
export function isAwaitingAnswer(state: SessionState): boolean {
  return state.screen === "lesson" && (state.phase === "listening" || state.phase === "choosing");
}

function demo(state: SessionState, ctx: EngineContext, path: DemoPath): SessionState {
  if (!isAwaitingAnswer(state)) return state;
  const st = currentStep(state, ctx.lesson);
  if (st.listen) {
    const map: Record<DemoPath, IntroAnswerKind> = {
      understands: "correct",
      confused: "dontknow",
      wrong: "unclear",
      strong: "strong",
    };
    return answerIntro(state, ctx, map[path]);
  }
  if (st.compare) {
    const wrongValue = Object.keys(st.compare.labels).find((k) => k !== st.compare!.correct) ?? st.compare.correct;
    return pickCompare(state, ctx, path === "wrong" || path === "confused" ? wrongValue : st.compare.correct);
  }
  const choices = getChoices(ctx.lesson, st);
  if (choices.length) {
    const ok = path === "understands" || path === "strong";
    const choice = choices.find((c) => (ok ? c.ok : !c.ok));
    if (choice) return pick(state, ctx, choice);
  }
  return state;
}

export function sessionReducer(state: SessionState, action: SessionAction, ctx: EngineContext): SessionState {
  const { lesson } = ctx;
  switch (action.type) {
    case "START":
      return goto({ ...createInitialState(lesson, ctx), screen: "lesson", startedAt: action.now }, ctx, lesson.entry);
    case "GOTO":
      return goto(state, ctx, action.id, action.extra);
    case "SPEECH_END": {
      if (state.screen !== "lesson" || state.phase !== "speaking") return state;
      const st = getStep(lesson, state.step);
      if (st.next) return state; // runtime pauses then dispatches GOTO
      return { ...state, phase: st.listen ? "listening" : "choosing" };
    }
    case "MIC_START":
      if (state.phase !== "listening" || state.recording) return state;
      return { ...state, recording: true };
    case "MIC_STOP":
      return { ...state, recording: false };
    case "INTRO_ANSWER":
      if (state.phase !== "listening") return state;
      return answerIntro(state, ctx, action.kind, action.transcript);
    case "PICK": {
      if (state.phase !== "choosing") return state;
      const choice = getChoices(lesson, currentStep(state, lesson))[action.index];
      return choice ? pick(state, ctx, choice) : state;
    }
    case "PICK_COMPARE":
      if (state.phase !== "choosing") return state;
      return pickCompare(state, ctx, action.value);
    case "TOGGLE_SQUARE": {
      if (state.phase !== "choosing") return state;
      const sel = state.selected;
      const i = action.index;
      const selected = sel.includes(i) ? sel.filter((x) => x !== i) : sel.length < 2 ? [...sel, i] : sel;
      return { ...state, selected };
    }
    case "THINK_END": {
      if (state.phase !== "thinking" || !state.pending) return state;
      return goto(state, ctx, state.pending.id, state.pending.extra);
    }
    case "BONUS":
      if (state.screen !== "end") return state;
      return goto({ ...state, screen: "lesson" }, ctx, lesson.bonusEntry);
    case "ASK_OPEN":
      if (state.screen !== "end") return state;
      return { ...state, screen: "ask", phase: "idle", adapt: null, pending: null, recording: false };
    case "ASK_TURN": {
      if (state.screen !== "ask") return state;
      const question = action.question.trim();
      const answer = action.answer.trim();
      if (!question && !answer) return state;
      return { ...state, askTurns: [...state.askTurns, { question, answer }] };
    }
    case "ASK_CLOSE": {
      if (state.screen !== "ask") return state;
      const asked = state.askTurns.length;
      const log =
        asked && !state.log.includes(fill(lesson.askLog, vars(ctx)))
          ? [...state.log, fill(lesson.askLog, vars(ctx))]
          : state.log;
      return { ...state, screen: "end", phase: "idle", log };
    }
    case "FINISH":
      return goto(state, ctx, SUMMARY_STEP, { endedAt: action.now });
    case "RESTART":
      return createInitialState(lesson, ctx);
    case "DEMO":
      return demo(state, ctx, action.path);
    default:
      return state;
  }
}

/** What the runtime should schedule once the current teacher line ends. */
export function afterSpeech(state: SessionState, lesson: LessonDefinition): AfterSpeech {
  const st = currentStep(state, lesson);
  if (st.next) return { kind: "pause", next: st.next };
  return { kind: "await", phase: st.listen ? "listening" : "choosing" };
}
