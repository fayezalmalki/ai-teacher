"use client";

import { useState } from "react";
import Link from "next/link";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import PoweredBy from "@/components/PoweredBy";
import Pizza from "@/components/visuals/Pizza";
import { SketchButton, SketchLink, btnRadius } from "@/components/Sketch";
import { LAST_SESSION, SUBJECTS, TODAY_LESSON, gradeLabel, type Tone } from "@/lib/content/catalog";
import { guidedDemo } from "@/lib/flags";
import { useAppStore } from "@/lib/store/app-store";

const BAR: Record<Tone, string> = {
  blue: "bg-primary",
  green: "bg-success",
  amber: "bg-yellow",
  neutral: "bg-ink",
};

export default function HomePage() {
  const { state } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const guided = guidedDemo() && !unlocked;

  return (
    <Frame>
      <AppHeader showChild showParent />
      <div className="flex-1 flex flex-col gap-12 px-6 sm:px-10 pt-12 pb-16 max-w-[1040px] w-full mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 items-center">
          <div className="flex flex-col gap-5 items-start min-w-0">
            <h1 className="font-display text-[48px] font-bold leading-[1.2] m-0">هلا {state.child.name}!</h1>
            <div className="text-[18px] text-ink-2">
              درس اليوم: <b className="font-semibold text-ink">{TODAY_LESSON.title}</b> · 10 دقائق
            </div>
            <SketchButton href={`/lesson/${TODAY_LESSON.lessonId}`} size="lg">
              يلا نبدأ
            </SketchButton>
            <div className="flex gap-1.5 items-center mt-2 flex-wrap">
              {LAST_SESSION.streak.map((v, i) => (
                <div key={i} className={"w-[22px] h-[22px] r-dot ink-2 " + (v ? "bg-primary" : "bg-surface")} />
              ))}
              <span className="text-[13px] text-muted mr-2">{LAST_SESSION.streakLabel}</span>
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
            <div className="text-[14px] text-muted">موادك · {gradeLabel(state.child.grade)}</div>
            <div className="flex gap-3.5 flex-wrap">
              {SUBJECTS.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/subjects/${s.id}`}
                  className={`flex items-center gap-3 pr-[18px] pl-3.5 py-3 ink-2 ${btnRadius(i)} bg-surface text-ink hover:text-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-sm`}
                >
                  <div className="font-display text-[18px] font-bold">{s.name}</div>
                  <div className="w-14 h-2 rounded-[4px] ink-2 overflow-hidden bg-surface">
                    <div className={"h-full " + BAR[s.tone]} style={{ width: `${s.pct}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex justify-end">
          <PoweredBy />
        </div>
      </div>
    </Frame>
  );
}
