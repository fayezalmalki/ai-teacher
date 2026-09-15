"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Teacher from "@/components/Teacher";
import Subtitle from "@/components/Subtitle";
import ExplainVisual from "@/components/visuals/ExplainVisual";
import LessonNotFound from "@/components/LessonNotFound";
import { SketchButton } from "@/components/Sketch";
import { explainSpeakDuration, getLesson } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";
import { createVoiceAdapter, resolveVoiceMode } from "@/lib/voice/select";
import type { Viseme } from "@/lib/voice/types";
import { resolveCharacterMode } from "@/lib/character/contract";

export default function ExplainPage() {
  return (
    <Suspense fallback={<Frame>{null}</Frame>}>
      <ExplainScreen />
    </Suspense>
  );
}

/** Avatar explanation mode: 4 auto-spoken steps, then "يلا نجرب مع بعض". */
function ExplainScreen() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { state: app } = useAppStore();
  const lesson = getLesson(id);
  const steps = useMemo(() => lesson?.explain ?? [], [lesson]);
  const [idx, setIdx] = useState(0);
  const [take, setTake] = useState(0);
  const [viseme, setViseme] = useState<Viseme>(0);
  // Audio needs a user gesture; after a deep link or reload, wait for a tap.
  const [armed, setArmed] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const voiceMode = resolveVoiceMode(params.get("voice"));
  const character = resolveCharacterMode(params.get("character"));
  const voice = useMemo(() => createVoiceAdapter(voiceMode, id, "demo", app.child.name), [voiceMode, id, app.child.name]);
  useEffect(() => () => voice.dispose(), [voice]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((i: number) => {
    setIdx(i);
    setSpeaking(true);
    setTake((t) => t + 1);
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
    if (voiceMode === "simulated" || nav.userActivation?.hasBeenActive) {
      setArmed(true);
      setSpeaking(true);
    }
  }, [voiceMode]);

  const arm = () => {
    (voice as { unlock?: () => void }).unlock?.();
    setArmed(true);
    say(0);
  };

  // Simulated: max(2200ms, 60ms × chars). Cascaded: the cached clip's real end event.
  useEffect(() => {
    if (!armed || !speaking || !steps[idx]) return;
    const controller = new AbortController();
    if (voiceMode === "cascaded") {
      voice
        .speak(steps[idx].text, { signal: controller.signal, onViseme: setViseme })
        .then(() => !controller.signal.aborted && setSpeaking(false))
        .catch(() => {});
    } else {
      timer.current = setTimeout(() => setSpeaking(false), explainSpeakDuration(steps[idx].text));
    }
    return () => {
      controller.abort();
      voice.interrupt();
      setViseme(0);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed, speaking, idx, take, steps, voice, voiceMode]);

  if (!lesson) return <LessonNotFound />;

  const last = idx === steps.length - 1;
  const done = last && !speaking;
  const step = steps[idx];

  const next = () => {
    if (idx < steps.length - 1) say(idx + 1);
    else {
      if (timer.current) clearTimeout(timer.current);
      voice.interrupt();
      setSpeaking(false);
    }
  };

  return (
    <Frame>
      <AppHeader showChild backHref={`/lesson/${lesson.id}`} />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center px-6 sm:px-14 pt-10 pb-6 max-w-[1100px] w-full mx-auto">
          <div className="flex flex-col items-start gap-7 min-w-0">
            <Teacher size={120} state={speaking ? "speaking" : "idle"} viseme={viseme} character={character} />
            <Subtitle id={`${idx}:${take}`} text={step.text} />
          </div>
          <div className="grid place-items-center min-h-[340px]">
            <ExplainVisual visual={step.visual} />
          </div>
        </div>
        <div className="min-h-[120px] flex items-center justify-center gap-3.5 flex-wrap px-8 pt-3 pb-10">
          {!armed ? (
            <SketchButton onClick={arm} size="lg" pop>
              ابدأ الشرح
            </SketchButton>
          ) : !done ? (
            <>
              <SketchButton variant="white" size="sm" index={1} onClick={() => say(idx)}>
                مرة ثانية
              </SketchButton>
              <SketchButton size="sm" index={0} onClick={next}>
                {last ? "خلصت" : "التالي"}
              </SketchButton>
            </>
          ) : (
            <SketchButton href={`/lesson/${lesson.id}/session`} variant="green" size="lg" pop>
              يلا نجرب مع بعض
            </SketchButton>
          )}
        </div>
      </div>
    </Frame>
  );
}
