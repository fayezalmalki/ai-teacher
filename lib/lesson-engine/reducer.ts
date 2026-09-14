import {
  END_STEP,
  SUMMARY_STEP,
  type AfterSpeech,
  type Choice,
  type DemoPath,
  type EngineContext,
  type IntroAnswerKind,
  type LessonDefinition,
  type LessonStep,
  type SessionAction,
  type SessionState,
} from "./types";
import { fill } from "./template";

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
};

export function createInitialState(lesson: LessonDefinition): SessionState {
  return { ...initialSessionState, step: lesson.entry };
}

export function getStep(lesson: LessonDefinition, id: string): LessonStep {
  const step = lesson.steps[id];
  if (!step) throw new Error(`Unknown lesson step: ${id}`);
  return step;
}

export function getChoices(lesson: LessonDefinition, step: LessonStep): Choice[] {
  if (!step.choices) return [];
  return lesson.choiceSets[step.choices] ?? [];
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
    next.difficulty = Math.min(lesson.levels.length, state.difficulty + 1);
    next.adapt = fill(lesson.levelUpAdapt, { level: lesson.levels[next.difficulty - 1] });
  }
  if (st.strategy) next.strategy = st.strategy;
  if (st.retry || st.reexplain) next.reexplain = state.reexplain + 1;
  if (st.log) next.log = [...(extra.log ?? state.log), fill(st.log, vars(ctx))];
  return next;
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
  return think(state, transcript?.trim() || r.transcript, r.go, {
    understanding: r.understanding,
    questions: state.questions + r.questions,
    correct: state.correct + r.correct,
    log: [...state.log, fill(r.log, vars(ctx))],
  });
}

function pick(state: SessionState, ctx: EngineContext, choice: Choice): SessionState {
  const st = getStep(ctx.lesson, state.step);
  const ok = !!choice.ok;
  const extra: Partial<SessionState> = {
    questions: state.questions + (st.retry ? 0 : 1),
    correct: state.correct + (ok ? 1 : 0),
    understanding: ok ? "good" : "partial",
  };
  if (!ok && st.wrongLog) extra.log = [...state.log, fill(st.wrongLog, vars(ctx))];
  const target = ok ? st.onOk : st.onWrong;
  if (!target) return state;
  return think(state, fill(ctx.lesson.choiceTranscript, vars(ctx, { choice: choice.l })), target, extra);
}

function pickCompare(state: SessionState, ctx: EngineContext, value: string): SessionState {
  const st = getStep(ctx.lesson, state.step);
  if (!st.compare) return state;
  const ok = value === st.compare.correct;
  const extra: Partial<SessionState> = {
    questions: state.questions + (st.retry ? 0 : 1),
    correct: state.correct + (ok ? 1 : 0),
    understanding: ok ? "good" : "partial",
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
  const st = getStep(ctx.lesson, state.step);
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
      return goto({ ...createInitialState(lesson), screen: "lesson", startedAt: action.now }, ctx, lesson.entry);
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
      const choice = getChoices(lesson, getStep(lesson, state.step))[action.index];
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
      return createInitialState(lesson);
    case "DEMO":
      return demo(state, ctx, action.path);
    default:
      return state;
  }
}

/** What the runtime should schedule once the current teacher line ends. */
export function afterSpeech(state: SessionState, lesson: LessonDefinition): AfterSpeech {
  const st = getStep(lesson, state.step);
  if (st.next) return { kind: "pause", next: st.next };
  return { kind: "await", phase: st.listen ? "listening" : "choosing" };
}
