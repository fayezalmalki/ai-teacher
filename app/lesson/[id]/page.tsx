"use client";

import { useParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import Teacher from "@/components/Teacher";
import LessonNotFound from "@/components/LessonNotFound";
import { fill, getLesson } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";

export default function LessonIntroPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  const { state } = useAppStore();
  if (!lesson) return <LessonNotFound />;
  return (
    <Frame>
      <AppHeader showChild />
      <div className="flex-1 grid place-items-center px-8 py-12">
        <div className="flex flex-col items-center gap-7 text-center max-w-[560px]">
          <Teacher size={150} glyphSize={62} state="speaking" ringInset={8} ringDuration="1.8s" />
          <div>
            <div className="text-[14px] text-muted">{lesson.intro.eyebrow}</div>
            <h1 className="text-[34px] font-bold mt-1 m-0">{lesson.intro.title}</h1>
          </div>
          <p className="text-[22px] leading-[1.6] font-medium text-ink text-pretty-wrap m-0">
            {fill(lesson.intro.line, { name: state.child.name })}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button href={`/lesson/${lesson.id}/explain`} className="px-8 py-[18px] rounded-tile text-[18px]">
              اشرح لي أول
            </Button>
            <Button href={`/lesson/${lesson.id}/session`} variant="secondary" className="px-8 py-[18px] rounded-tile text-[18px]">
              ودّي أجرب مباشرة
            </Button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
