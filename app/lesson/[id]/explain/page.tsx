"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import Teacher from "@/components/Teacher";
import StatusPill from "@/components/StatusPill";
import Subtitle from "@/components/Subtitle";
import ProgressBars from "@/components/ProgressBars";
import ExplainVisual from "@/components/visuals/ExplainVisual";
import LessonNotFound from "@/components/LessonNotFound";
import { explainSpeakDuration, getLesson } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";
import { createVoiceAdapter, resolveVoiceMode } from "@/lib/voice/select";
import type { Viseme } from "@/lib/voice/types";

export default function ExplainPage() {
  return (
    <Suspense fallback={<Frame>{null}</Frame>}>
      <ExplainScreen />
    </Suspense>
  );
}

/** Avatar explanation mode: 4 auto-spoken steps, then "نبدأ الأسئلة". */
function ExplainScreen() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { state: app } = useAppStore();
  const lesson = getLesson(id);
  const steps = useMemo(() => lesson?.explain ?? [], [lesson]);
  const [idx, setIdx] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  const [take, setTake] = useState(0);
  const [viseme, setViseme] = useState<Viseme>(0);

  const voiceMode = resolveVoiceMode(params.get("voice"));
  const voice = useMemo(() => createVoiceAdapter(voiceMode, id, "demo", app.child.name), [voiceMode, id, app.child.name]);
  useEffect(() => () => voice.dispose(), [voice]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((i: number) => {
    setIdx(i);
    setSpeaking(true);
    setTake((t) => t + 1);
  }, []);

  // Simulated: max(2200ms, 60ms × chars). Cascaded: the cached clip's real end event.
  useEffect(() => {
    if (!speaking || !steps[idx]) return;
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
  }, [speaking, idx, take, steps, voice, voiceMode]);

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
      <AppHeader showChild />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 px-8 pt-9 pb-6">
          <div className="flex flex-col items-start gap-5">
            <Teacher
              size={180}
              glyphSize={74}
              border={8}
              ringInset={8}
              state={speaking ? "speaking" : "idle"}
              viseme={voiceMode === "cascaded" ? viseme : undefined}
            />
            <StatusPill label={speaking ? "يشرح…" : "انتهى من الشرح"} tone="primary" active={speaking} />
            <Subtitle id={`${idx}:${take}`} text={step.text} size={26} />
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="flex-1 min-h-[340px] rounded-card bg-surface-2 grid place-items-center p-7">
              <ExplainVisual visual={step.visual} />
            </div>
            <ProgressBars total={steps.length} filled={idx + 1} />
          </div>
        </div>
        <div className="border-t border-border px-8 py-5 min-h-[96px] flex items-center justify-center gap-3 flex-wrap">
          {!done ? (
            <>
              <Button variant="secondary" onClick={() => say(idx)} className="px-6 py-3.5 text-[16px]">
                أعد الشرح
              </Button>
              <Button onClick={next} className="px-7 py-3.5 text-[16px] shadow-none">
                {last ? "خلصت" : "التالي"}
              </Button>
            </>
          ) : (
            <div className="flex gap-3 items-center flex-wrap justify-center">
              <span className="text-[17px] text-ink-2">جاهز نجرب مع بعض؟</span>
              <Button href={`/lesson/${lesson.id}/session`} variant="success" className="px-[30px] py-4 text-[17px]">
                نبدأ الأسئلة
              </Button>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
