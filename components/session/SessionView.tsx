"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Frame from "@/components/Frame";
import ProgressDots from "@/components/ProgressDots";
import StatusPill, { type StatusTone } from "@/components/StatusPill";
import Subtitle from "@/components/Subtitle";
import Teacher, { type TeacherState } from "@/components/Teacher";
import Button from "@/components/Button";
import { ChildChip } from "@/components/AppHeader";
import SessionVisual from "@/components/visuals/SessionVisual";
import AdaptChip from "./AdaptChip";
import InteractionBar, { type InteractionBarProps } from "./InteractionBar";
import DemoControls from "./DemoControls";
import {
  currentStep,
  engineStateJson,
  fill,
  getChoices,
  observationNotes,
  progressDots,
  ratingLabel,
  teacherLine,
  thinkingLabel,
  toSessionResult,
  type LessonDefinition,
  type Pace,
} from "@/lib/lesson-engine";
import { useLessonSession } from "@/lib/lesson-engine/useLessonSession";
import { SimulatedVoiceAdapter } from "@/lib/voice";
import { useAppStore } from "@/lib/store/app-store";


interface SessionViewProps {
  lesson: LessonDefinition;
}

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  speaking: { label: "يتحدث…", tone: "primary" },
  listening: { label: "أنا أسمعك", tone: "success" },
  thinking: { label: "أفهم إجابتك…", tone: "neutral" },
  choosing: { label: "ينتظر إجابتك", tone: "success" },
};

export default function SessionView({ lesson }: SessionViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { state: app, childInitial, setLastResult } = useAppStore();
  const name = app.child.name;

  const pace: Pace = params.get("pace") === "fast" ? "fast" : "demo";
  const showEngine = params.get("engine") === "1";
  const [demoVisible, setDemoVisible] = useState(params.get("demo") === "1" || process.env.NODE_ENV === "development");
  const taps = useRef(0);
  const onSecretTap = () => {
    taps.current += 1;
    if (taps.current >= 5) setDemoVisible(true);
  };

  const voice = useMemo(() => new SimulatedVoiceAdapter(pace), [pace]);
  useEffect(() => () => voice.dispose(), [voice]);

  const session = useLessonSession({ lesson, name, voice, pace, autoStart: true });
  const { state } = session;

  // Summary lives on its own route: persist the result and navigate.
  const navigated = useRef(false);
  useEffect(() => {
    if (state.screen === "summary" && !navigated.current) {
      navigated.current = true;
      setLastResult(toSessionResult(state, lesson, name));
      router.push(`/lesson/${lesson.id}/summary`);
    }
  }, [state, lesson, name, router, setLastResult]);

  const step = currentStep(state, lesson);
  const phase = state.phase;
  const speaking = phase === "speaking";
  const listening = phase === "listening";
  const thinking = phase === "thinking";
  const choosing = phase === "choosing";
  const encouraging = step.mood === "encourage" && speaking;

  const teacherState: TeacherState = encouraging
    ? "encouraging"
    : speaking
      ? "speaking"
      : listening || state.recording
        ? "listening"
        : thinking
          ? "thinking"
          : "idle";

  const status = STATUS[phase];
  const chocPick = step.visual === "chocPick";
  const choices = getChoices(lesson, step);
  const showChoices = choosing && choices.length > 0 && (!chocPick || state.selected.length === 2);

  const barMode: InteractionBarProps["mode"] = listening
    ? "mic"
    : thinking
      ? "thinking"
      : showChoices
        ? "choices"
        : speaking
          ? "speaking"
          : choosing && chocPick && state.selected.length < 2
            ? "pickHint"
            : "idle";

  const dots = progressDots(state, lesson);
  const notes = observationNotes(state.visited, lesson);
  const rating = ratingLabel(state.questions, state.correct, lesson);

  return (
    <Frame variant="session">
      <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-border flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-chip bg-primary-tint text-primary grid place-items-center font-bold text-[15px]"
            onClick={onSecretTap}
          >
            ن
          </div>
          <div>
            <div className="font-semibold text-[16px]">{lesson.title}</div>
            <div className="text-[13px] text-muted">
              {lesson.subject} · {lesson.teacher}
            </div>
          </div>
        </div>
        <ProgressDots done={dots} />
        <ChildChip />
      </div>

      {state.screen === "start" && (
        <div className="flex-1 grid place-items-center px-8 py-12">
          <div className="max-w-[520px] w-full text-center flex flex-col items-center gap-7">
            <Teacher size={112} glyphSize={44} />
            <div>
              <div className="text-[36px] font-bold leading-[1.35]">هلا {name} 👋</div>
              <div className="text-[28px] font-medium leading-[1.4] text-ink-2 mt-1.5">جاهز نبدأ درس اليوم؟</div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="px-[18px] py-2.5 rounded-pill bg-surface-3 text-[15px] text-ink-2">
                موضوع اليوم: <b className="font-semibold text-ink">الكسور</b>
              </div>
              <div className="px-[18px] py-2.5 rounded-pill bg-surface-3 text-[15px] text-ink-2">
                الوقت المتوقع: <b className="font-semibold text-ink">{lesson.durationLabel}</b>
              </div>
            </div>
            <Button onClick={session.start} className="mt-2 px-9 py-[18px] rounded-tile text-[19px]">
              ابدأ مع {lesson.teacher}
            </Button>
          </div>
        </div>
      )}

      {state.screen === "lesson" && (
        <>
          <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 px-8 pt-9 pb-6">
            <div className="flex flex-col items-start gap-5">
              <Teacher size={128} glyphSize={52} state={teacherState} onClick={onSecretTap} />
              {status && <StatusPill label={status.label} tone={status.tone} active={speaking || listening || state.recording} />}
              <div className="text-[15px] text-muted">{lesson.teacher}</div>
              <Subtitle id={state.step + ":" + state.visited.length} text={teacherLine(state, lesson, name)} />
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="flex-1 min-h-[360px] rounded-card bg-surface-2 grid place-items-center p-7 relative">
                <SessionVisual
                  visual={step.visual}
                  selected={state.selected}
                  choosing={choosing}
                  onToggleSquare={session.toggleSquare}
                  onPickCompare={session.pickCompare}
                  compareLabels={step.compare?.labels}
                />
                {showEngine && (
                  <div className="absolute top-3.5 left-3.5 flex gap-1.5 flex-wrap" dir="ltr">
                    {[
                      `difficulty: ${state.difficulty}`,
                      `understanding: ${state.understanding}`,
                      `strategy: ${state.strategy}`,
                    ].map((t) => (
                      <div key={t} className="text-[11px] font-mono bg-surface border border-border-3 rounded-lg px-2 py-1 text-ink-2">
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {state.adapt && (
                <AdaptChip text={state.adapt} tone={state.adapt.startsWith("رفع") ? "levelUp" : "strategy"} />
              )}
            </div>
          </div>
          <InteractionBar
            mode={barMode}
            recording={state.recording}
            onMic={session.tapMic}
            choices={choices}
            onPick={session.pick}
            transcript={state.transcript}
            thinkingLabel={thinkingLabel(state, lesson)}
            childInitial={childInitial}
            teacherName={lesson.teacher}
          />
        </>
      )}

      {state.screen === "end" && (
        <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 px-8 py-10">
          <div className="flex flex-col gap-5 items-start">
            <Teacher size={112} glyphSize={44} badge badgeSize={36} />
            <div className="text-[24px] leading-[1.6] font-medium text-pretty-wrap">{fill(lesson.endLine, { name })}</div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-card bg-surface-2 p-6">
              <div className="text-[14px] text-muted">فهمك اليوم</div>
              <div className="text-[30px] font-bold text-success mt-1">{rating}</div>
            </div>
            <div className="rounded-card border border-border p-6">
              <div className="text-[15px] font-semibold mb-3">لاحظت أنك:</div>
              <div className="flex flex-col gap-2.5">
                {notes.map((n) => (
                  <div key={n} className="flex gap-2.5 items-start text-[16px] leading-[1.5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-none" />
                    <span>{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={session.bonus} className="px-7 py-4 text-[17px] shadow-none">
                جرّب سؤال أخير
              </Button>
              <Button variant="secondary" onClick={session.finish} className="px-7 py-4 text-[17px]">
                إنهاء الدرس
              </Button>
            </div>
          </div>
        </div>
      )}

      {state.screen === "summary" && (
        <div className="flex-1 grid place-items-center text-muted text-[15px]">جارٍ تجهيز الملخص…</div>
      )}

      {demoVisible && (
        <DemoControls
          active={session.awaiting}
          onPath={session.demo}
          engineJson={showEngine ? engineStateJson(state, lesson) : undefined}
          childName={name}
        />
      )}
    </Frame>
  );
}
