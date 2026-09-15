"use client";

import { useState } from "react";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import PoweredBy from "@/components/PoweredBy";
import Pizza from "@/components/visuals/Pizza";
import SubjectCards from "@/components/SubjectCards";
import { SketchButton, SketchLink } from "@/components/Sketch";
import { TODAY_LESSON, gradeLabel } from "@/lib/content/catalog";
import { todaysLesson } from "@/lib/content/paths";
import { guidedDemo } from "@/lib/flags";
import { lessonTitle } from "@/lib/lessons";
import { streakDays } from "@/lib/store/insights";
import { useAppStore } from "@/lib/store/app-store";

export default function HomePage() {
  const { child, results } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const guided = guidedDemo() && !unlocked;
  const today = todaysLesson(results) ?? { lessonId: TODAY_LESSON.lessonId, subjectId: TODAY_LESSON.subjectId, done: false };
  const streak = streakDays(results);
  const streakCount = streak.filter(Boolean).length;

  return (
    <Frame>
      <AppHeader showChild showParent />
      <div className="flex-1 flex flex-col gap-12 px-6 sm:px-10 pt-12 pb-16 max-w-[1040px] w-full mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center">
          <div className="flex flex-col gap-5 items-start min-w-0">
            <h1 className="font-display text-[48px] font-bold leading-[1.2] m-0">هلا {child.name}!</h1>
            <div className="text-[18px] text-ink-2">
              {today.done ? "خلصت درس اليوم: " : "درس اليوم: "}
              <b className="font-semibold text-ink">{lessonTitle(today.lessonId).replace(/^درس /, "")}</b> · 10 دقائق
            </div>
            <SketchButton href={`/lesson/${today.lessonId}`} size="lg">
              {today.done ? "نعيده مرة ثانية" : "يلا نبدأ"}
            </SketchButton>
            <div className="flex gap-1.5 items-center mt-2 flex-wrap">
              {streak.map((v, i) => (
                <div key={i} className={"w-[22px] h-[22px] r-dot ink-2 " + (v ? "bg-primary" : "bg-surface")} />
              ))}
              <span className="text-[13px] text-muted mr-2">
                {streakCount === 0 ? "ما فيه جلسات هذا الأسبوع بعد" : streakCount === 1 ? "يوم واحد هذا الأسبوع" : streakCount === 2 ? "يومان هذا الأسبوع" : `${streakCount} أيام هذا الأسبوع`}
              </span>
            </div>
          </div>
          <div className="grid place-items-center py-4">
            <div className="relative w-[240px] h-[240px] motion animate-float">
              <Pizza filled={2} dividers="v" size={240} pop={false} />
              <div className="absolute -right-5 bottom-2.5 px-3.5 py-2 ink-2 r-bubble-1 bg-yellow text-[14px] font-semibold whitespace-nowrap motion animate-pop-in" style={{ animationDelay: ".4s" }}>
                وش يعني النصف؟
              </div>
            </div>
          </div>
        </div>

        {guided ? (
          <div className="flex items-center gap-3 flex-wrap text-[14px] text-muted">
            <span>بقية المواد تُفتح بعد درس اليوم.</span>
            <SketchLink onClick={() => setUnlocked(true)} className="text-[14px]">
              استعرض كل المواد
            </SketchLink>
          </div>
        ) : (
          <div className="flex flex-col gap-4 motion animate-fade-up">
            <div className="text-[14px] text-muted">موادك · {gradeLabel(child.grade)}</div>
            <SubjectCards progress />
          </div>
        )}

        <div className="mt-auto flex justify-end">
          <PoweredBy />
        </div>
      </div>
    </Frame>
  );
}
