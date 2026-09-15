"use client";

import { useParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Teacher from "@/components/Teacher";
import LessonNotFound from "@/components/LessonNotFound";
import { SketchButton } from "@/components/Sketch";
import { getLesson } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";

export default function LessonIntroPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  const { state } = useAppStore();
  if (!lesson) return <LessonNotFound />;
  return (
    <Frame>
      <AppHeader showChild backHref="/home" />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="flex flex-col items-center gap-[30px] text-center max-w-[560px]">
          <Teacher size={140} ring idleWobble />
          <h1 className="font-display text-[28px] sm:text-[34px] font-semibold leading-[1.45] text-pretty-wrap m-0">
            هلا {state.child.name}. أشرح لك أول، أو نجرب مباشرة؟
          </h1>
          <div className="flex gap-3.5 flex-wrap justify-center">
            <SketchButton href={`/lesson/${lesson.id}/explain`} size="lg" index={0}>
              اشرح لي
            </SketchButton>
            <SketchButton href={`/lesson/${lesson.id}/session`} size="lg" variant="white" index={1}>
              نجرب
            </SketchButton>
          </div>
        </div>
      </div>
    </Frame>
  );
}
