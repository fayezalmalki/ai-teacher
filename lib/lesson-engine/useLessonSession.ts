"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ListenError, Viseme, VoiceAdapter } from "@/lib/voice/types";
import { toTurnState } from "./contract";
import { track } from "@/lib/analytics/events";
import { afterSpeech, createInitialState, isAwaitingAnswer, sessionReducer } from "./reducer";
import { PAUSE_MS, THINK_MS, scaled, type Pace } from "./timing";
import { teacherLine } from "./selectors";
import type { DemoPath, EngineContext, IntroAnswerKind, LessonDefinition, SessionAction, SessionState } from "./types";

interface Options {
  lesson: LessonDefinition;
  name: string;
  voice: VoiceAdapter;
  pace?: Pace;
  autoStart?: boolean;
  /** Parent-facing overrides (start level); the lesson's defaults apply otherwise. */
  policy?: EngineContext["policy"];
}

/**
 * Client runtime around the pure reducer. It owns the timers: it asks the
 * voice adapter to speak each teacher line, pauses before auto-advancing,
 * runs the "thinking" delay, and turns a mic tap into a listen() call.
 */
export function useLessonSession({ lesson, name, voice, pace = "demo", autoStart = false, policy }: Options) {
  const startLevel = policy?.startLevel;
  const maxLevel = policy?.maxLevel;
  const ctx = useMemo<EngineContext>(
    () => ({ lesson, name, policy: { ...(startLevel !== undefined ? { startLevel } : {}), ...(maxLevel !== undefined ? { maxLevel } : {}) } }),
    [lesson, name, startLevel, maxLevel],
  );
  const reducer = useCallback((s: SessionState, a: SessionAction) => sessionReducer(s, a, ctx), [ctx]);
  const [state, dispatch] = useReducer(reducer, ctx, (c) => createInitialState(c.lesson, c));
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Current mouth shape from the voice adapter (0 = rest). */
  const [viseme, setViseme] = useState<Viseme>(0);
  /** Input level 0–1 while recording. */
  const [level, setLevel] = useState(0);
  /** Last listen failure; the UI offers the tap fallback while set. */
  const [listenError, setListenError] = useState<ListenError | null>(null);

  // Auto-start once.
  const started = useRef(false);
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      dispatch({ type: "START", now: Date.now() });
    }
  }, [autoStart]);

  useEffect(() => {
    if (state.screen === "lesson" && state.startedAt && state.visited.length === 1) {
      track({ name: "session_started", lessonId: lesson.id, childName: name });
    }
    if (state.screen === "summary") {
      track({
        name: "session_ended",
        lessonId: lesson.id,
        questions: state.questions,
        correct: state.correct,
        reexplain: state.reexplain,
      });
    }
  }, [state.screen, state.startedAt, state.visited.length, state.questions, state.correct, state.reexplain, lesson.id, name]);

  // Speaking → (pause → next) | (listening/choosing)
  const visitCount = state.visited.length;
  useEffect(() => {
    if (state.screen !== "lesson" || state.phase !== "speaking") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    track({ name: "step_entered", lessonId: lesson.id, step: state.step, difficulty: state.difficulty, strategy: state.strategy });
    if (state.adapt) track({ name: "adaptation", lessonId: lesson.id, text: state.adapt });
    const text = teacherLine(state, lesson, name);
    voice
      .speak(text, { signal: controller.signal, onViseme: setViseme })
      .then(() => {
        if (controller.signal.aborted) return;
        const next = afterSpeech(stateRef.current, lesson);
        if (next.kind === "pause") {
          timer = setTimeout(() => {
            if (controller.signal.aborted) return;
            dispatch({ type: "GOTO", id: next.next, extra: next.next === "SUMMARY" ? { endedAt: Date.now() } : undefined });
          }, scaled(PAUSE_MS, pace));
        } else {
          dispatch({ type: "SPEECH_END" });
        }
      })
      .catch(() => {
        /* interrupted */
      });
    return () => {
      controller.abort();
      voice.interrupt();
      setViseme(0);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen, state.phase, state.step, visitCount, lesson, name, voice, pace]);

  // Thinking → THINK_END
  useEffect(() => {
    if (state.phase !== "thinking") return;
    const t = setTimeout(() => dispatch({ type: "THINK_END" }), scaled(THINK_MS, pace));
    return () => clearTimeout(t);
  }, [state.phase, state.pending, pace]);

  // Recording → listen() → intro answer
  useEffect(() => {
    if (!state.recording) return;
    const controller = new AbortController();
    const current = stateRef.current;
    setListenError(null);
    voice
      .listen({
        signal: controller.signal,
        expectedKind: "correct",
        onLevel: setLevel,
        context: { teacherLine: teacherLine(current, lesson, name), turnState: toTurnState(current, lesson) },
      })
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.error) {
          setListenError(res.error);
          dispatch({ type: "MIC_STOP" });
          return;
        }
        const valid: IntroAnswerKind[] = ["correct", "unclear", "dontknow", "strong"];
        // Simulated adapters return the kind in `transcript`; real ones classify and return `kind`.
        const kind = res.kind ?? ((valid as string[]).includes(res.transcript) ? (res.transcript as IntroAnswerKind) : "correct");
        const transcript = res.kind ? res.transcript : undefined;
        if (transcript) track({ name: "answer", lessonId: lesson.id, step: current.step, correct: kind === "correct" || kind === "strong", transcript });
        dispatch({ type: "INTRO_ANSWER", kind, transcript });
      })
      .catch(() => dispatch({ type: "MIC_STOP" }))
      .finally(() => setLevel(0));
    return () => {
      controller.abort();
      voice.interrupt();
    };
  }, [state.recording, voice, lesson, name]);

  const api = useMemo(
    () => ({
      start: () => {
        (voice as { unlock?: () => void }).unlock?.();
        dispatch({ type: "START", now: Date.now() });
      },
      tapMic: () => dispatch({ type: "MIC_START" }),
      /** Tap fallback when the mic is unavailable: the child picks what they would have said. */
      answerIntro: (kind: IntroAnswerKind) => dispatch({ type: "INTRO_ANSWER", kind }),
      pick: (index: number) => dispatch({ type: "PICK", index }),
      pickCompare: (value: string) => dispatch({ type: "PICK_COMPARE", value }),
      toggleSquare: (index: number) => dispatch({ type: "TOGGLE_SQUARE", index }),
      demo: (path: DemoPath) => dispatch({ type: "DEMO", path }),
      bonus: () => dispatch({ type: "BONUS" }),
      askOpen: () => dispatch({ type: "ASK_OPEN" }),
      askTurn: (question: string, answer: string) => dispatch({ type: "ASK_TURN", question, answer }),
      askClose: () => dispatch({ type: "ASK_CLOSE" }),
      finish: () => dispatch({ type: "FINISH", now: Date.now() }),
      restart: () => dispatch({ type: "RESTART" }),
    }),
    [voice],
  );

  return { state, awaiting: isAwaitingAnswer(state), viseme, level, listenError, ...api };
}
