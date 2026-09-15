"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Frame from "@/components/Frame";
import Subtitle from "@/components/Subtitle";
import Teacher, { type TeacherState } from "@/components/Teacher";
import { BackButton, ChildChip } from "@/components/AppHeader";
import { SketchButton, SketchLink } from "@/components/Sketch";
import SessionVisual from "@/components/visuals/SessionVisual";
import AdaptChip from "./AdaptChip";
import InteractionBar, { type InteractionBarProps } from "./InteractionBar";
import DemoControls from "./DemoControls";
import AskTeacher from "./AskTeacher";
import {
  currentStep,
  engineStateJson,
  fill,
  getChoices,
  progressDots,
  ratingLabel,
  teacherLine,
  thinkingLabel,
  toSessionResult,
  type LessonDefinition,
  type Pace,
} from "@/lib/lesson-engine";
import { useLessonSession } from "@/lib/lesson-engine/useLessonSession";
import { asReadable, createVoiceAdapter, resolveVoiceMode } from "@/lib/voice/select";
import { resolveCharacterMode } from "@/lib/character/contract";
import { useAppStore } from "@/lib/store/app-store";
import { visualNeedsPick } from "@/lib/lesson-engine/visuals";
import SoundToggle from "./SoundToggle";

interface SessionViewProps {
  lesson: LessonDefinition;
}

export default function SessionView({ lesson }: SessionViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { child, settings, childInitial, addResult, setSettings } = useAppStore();
  const name = child.name;

  const pace: Pace = params.get("pace") === "fast" ? "fast" : "demo";
  const showEngine = params.get("engine") === "1";
  const [demoVisible, setDemoVisible] = useState(params.get("demo") === "1" || process.env.NODE_ENV === "development");
  const taps = useRef(0);
  const onSecretTap = () => {
    taps.current += 1;
    if (taps.current >= 5) setDemoVisible(true);
  };

  const voiceMode = resolveVoiceMode(params.get("voice"), settings.sound);
  const reading = voiceMode === "reading";
  const voice = useMemo(() => createVoiceAdapter(voiceMode, lesson.id, pace, name), [voiceMode, lesson.id, pace, name]);
  useEffect(() => () => voice.dispose(), [voice]);

  // Browsers only play audio after a user gesture. A client-side navigation keeps
  // the activation; a deep link or reload does not, so show the start screen then.
  // Decided once on arrival: toggling the sound mode later must not start the lesson.
  const [autoStart] = useState(
    () => voiceMode === "simulated" || (typeof navigator !== "undefined" && (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive === true),
  );
  const policy = useMemo(() => ({ startLevel: settings.startLevel }), [settings.startLevel]);
  const session = useLessonSession({ lesson, name, voice, pace, autoStart, policy });
  const { state } = session;
  const character = resolveCharacterMode(params.get("character"));
  const liveMock = params.get("live") === "mock";
  const askEnabled = settings.liveAsk && !reading;
  const advance = () => asReadable(voice)?.advance();
  const toggleSound = () => setSettings({ sound: settings.sound === "reading" ? "voice" : "reading" });

  // Summary lives on its own route: persist the result and navigate.
  const navigated = useRef(false);
  useEffect(() => {
    if (state.screen === "summary" && !navigated.current) {
      navigated.current = true;
      addResult(toSessionResult(state, lesson, name));
      router.push(`/lesson/${lesson.id}/summary`);
    }
  }, [state, lesson, name, router, addResult]);

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
      : (listening && !reading) || state.recording
        ? "listening"
        : thinking
          ? "thinking"
          : "idle";

  const chocPick = visualNeedsPick(step.visual);
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
  const rating = ratingLabel(state.questions, state.correct, lesson);

  return (
    <Frame variant="session">
      {/* The session draws its own chrome row: back + lesson name, progress dots, child initial. */}
      <div className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-[22px]">
        <div className="flex items-center gap-2.5">
          <BackButton href={`/lesson/${lesson.id}`} />
          <div className="text-[13px] text-muted font-medium" onClick={onSecretTap}>
            {lesson.title}
          </div>
        </div>
        <div className="flex gap-2" aria-label="التقدّم">
          {dots.map((d, i) => (
            <div key={i} className={"w-[9px] h-[9px] r-dot ink-2 transition-colors duration-[400ms] " + (d ? "bg-primary" : "bg-surface")} />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          {!params.get("voice") && <SoundToggle reading={reading} onToggle={toggleSound} />}
          <ChildChip />
        </div>
      </div>

      {state.screen === "start" && (
        <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
          <div className="max-w-[520px] w-full text-center flex flex-col items-center gap-7">
            <Teacher size={140} character={character} idleWobble onClick={onSecretTap} />
            <div className="font-display text-[36px] sm:text-[44px] font-bold leading-[1.25]">هلا {name}، جاهز؟</div>
            <div className="text-[18px] text-ink-2">اليوم نتعلم الكسور. {lesson.durationLabel} بس.</div>
            <SketchButton onClick={session.start} size="lg" className="mt-1">
              يلا نبدأ
            </SketchButton>
            {!params.get("voice") && (
              <SketchLink onClick={toggleSound} className="text-[14px]">
                {reading ? "بالصوت" : "بدون صوت"}
              </SketchLink>
            )}
          </div>
        </div>
      )}

      {state.screen === "lesson" && (
        <>
          <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center px-6 sm:px-14 pt-10 pb-6 max-w-[1100px] w-full mx-auto">
            <div className="flex flex-col items-start gap-7 min-w-0">
              <Teacher
                size={120}
                state={teacherState}
                viseme={session.viseme}
                level={session.level}
                character={character}
                onClick={onSecretTap}
              />
              <Subtitle id={state.step + ":" + state.visited.length} text={teacherLine(state, lesson, name)} />
              {state.adapt && <AdaptChip text={state.adapt} />}
            </div>
            <div className="grid place-items-center min-h-[360px] relative">
              <SessionVisual
                visual={step.visual}
                selected={state.selected}
                choosing={choosing}
                onToggleSquare={session.toggleSquare}
                onPickCompare={session.pickCompare}
                compareLabels={step.compare?.labels}
              />
              {showEngine && (
                <div className="absolute top-0 left-0 text-[11px] font-mono text-muted leading-[1.6]" dir="ltr">
                  difficulty {state.difficulty} · understanding {state.understanding} · strategy {state.strategy}
                </div>
              )}
            </div>
          </div>
          <InteractionBar
            mode={barMode}
            reading={reading}
            onAdvance={advance}
            recording={state.recording}
            onMic={session.tapMic}
            listenError={session.listenError}
            introResponses={lesson.introResponses}
            onIntroAnswer={session.answerIntro}
            choices={choices}
            onPick={session.pick}
            transcript={state.transcript}
            thinkingLabel={thinkingLabel(state, lesson)}
          />
        </>
      )}

      {state.screen === "end" && (
        <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
          <div className="flex flex-col items-center gap-7 text-center max-w-[560px]">
            <Teacher size={130} badge badgeSize={42} state="encouraging" character={character} />
            <div className="font-display text-[34px] sm:text-[40px] font-bold leading-[1.3]">
              {rating} يا {name}!
            </div>
            <div className="text-[20px] leading-[1.7] text-dark-3 text-pretty-wrap">{fill(lesson.endLine, { name })}</div>
            <div className="flex gap-3.5 flex-wrap justify-center">
              <SketchButton onClick={session.bonus} index={0} pop>
                سؤال أخير؟
              </SketchButton>
              {askEnabled && (
                <SketchButton variant="yellow" onClick={session.askOpen} index={2} pop popDelay={0.08}>
                  {lesson.ask.cta}
                </SketchButton>
              )}
              <SketchButton variant="white" onClick={session.finish} index={1} pop popDelay={0.16}>
                خلصنا
              </SketchButton>
            </div>
          </div>
        </div>
      )}

      {state.screen === "ask" && (
        <AskTeacher
          lesson={lesson}
          name={name}
          childInitial={childInitial}
          character={character}
          forceMock={liveMock}
          onTurn={session.askTurn}
          onClose={session.askClose}
        />
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
