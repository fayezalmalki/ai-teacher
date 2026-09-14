"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { VoiceAdapter } from "@/lib/voice/types";
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
}

/**
 * Client runtime around the pure reducer. It owns the timers: it asks the
 * voice adapter to speak each teacher line, pauses before auto-advancing,
 * runs the "thinking" delay, and turns a mic tap into a listen() call.
 */
export function useLessonSession({ lesson, name, voice, pace = "demo", autoStart = false }: Options) {
  const ctx = useMemo<EngineContext>(() => ({ lesson, name }), [lesson, name]);
  const reducer = useCallback((s: SessionState, a: SessionAction) => sessionReducer(s, a, ctx), [ctx]);
  const [state, dispatch] = useReducer(reducer, lesson, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

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
      .speak(text, { signal: controller.signal })
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
    voice
      .listen({ signal: controller.signal, expectedKind: "correct" })
      .then((res) => {
        if (controller.signal.aborted) return;
        const kind = (res.transcript || "correct") as IntroAnswerKind;
        const valid: IntroAnswerKind[] = ["correct", "unclear", "dontknow", "strong"];
        dispatch({ type: "INTRO_ANSWER", kind: valid.includes(kind) ? kind : "correct" });
      })
      .catch(() => dispatch({ type: "MIC_STOP" }));
    return () => {
      controller.abort();
      voice.interrupt();
    };
  }, [state.recording, voice]);

  const api = useMemo(
    () => ({
      start: () => dispatch({ type: "START", now: Date.now() }),
      tapMic: () => dispatch({ type: "MIC_START" }),
      pick: (index: number) => dispatch({ type: "PICK", index }),
      pickCompare: (value: string) => dispatch({ type: "PICK_COMPARE", value }),
      toggleSquare: (index: number) => dispatch({ type: "TOGGLE_SQUARE", index }),
      demo: (path: DemoPath) => dispatch({ type: "DEMO", path }),
      bonus: () => dispatch({ type: "BONUS" }),
      finish: () => dispatch({ type: "FINISH", now: Date.now() }),
      restart: () => dispatch({ type: "RESTART" }),
    }),
    [],
  );

  return { state, awaiting: isAwaitingAnswer(state), ...api };
}
