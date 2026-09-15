"use client";

import { useParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import LessonNotFound from "@/components/LessonNotFound";
import { SketchButton, SketchPill } from "@/components/Sketch";
import { toArabicDigits } from "@/lib/format";
import { getLesson, summaryStats } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";

/** Parent summary of the last session: 4 big numbers, the adaptation log, the child's questions. */
export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  const { child, lastResult, hydrated } = useAppStore();
  if (!lesson) return <LessonNotFound />;
  const result = lastResult && lastResult.lessonId === lesson.id ? lastResult : null;
  const stats = result ? summaryStats(result, lesson) : [];
  const numbers = stats.slice(0, 4);
  const levels = stats.slice(4);

  return (
    <Frame>
      <AppHeader showChild backHref="/home" />
      <div className="flex-1 flex flex-col gap-8 px-6 sm:px-8 pt-10 pb-20 max-w-[720px] w-full mx-auto">
        <div>
          <div className="text-[14px] text-muted">لولي الأمر</div>
          <h1 className="font-display text-[36px] font-bold mt-0.5 m-0">جلسة {child.name} اليوم</h1>
        </div>
        {hydrated && !result && (
          <div className="text-[16px] leading-[1.7] text-ink-2 px-[18px] py-3.5 border-2 border-dashed border-rule r-input">
            ما فيه جلسة مكتملة بعد. ابدأ الدرس أولًا وبعدها يظهر الملخص هنا.
          </div>
        )}
        {result && (
          <>
            <div className="flex gap-7 flex-wrap">
              {numbers.map((s) => (
                <div key={s.k} className="flex flex-col gap-0.5 min-w-[120px]">
                  <div className="font-display text-[34px] font-bold leading-none">{toArabicDigits(String(s.v))}</div>
                  <div className="text-[13px] text-muted">{s.k}</div>
                </div>
              ))}
            </div>
            {levels.length > 0 && (
              <div className="text-[14px] text-muted -mt-3">
                {levels.map((s) => `${s.k}: ${s.v}`).join(" · ")}
              </div>
            )}
            <div className="flex flex-col gap-4 dashed-rule pt-6">
              <div className="text-[15px] font-semibold">كيف تكيّف {lesson.teacher}</div>
              {result.log.map((t, i) => (
                <div key={i} className="flex gap-3.5 items-start text-[16px] leading-[1.6]">
                  <span className="w-[26px] h-[26px] r-dot ink-2 bg-surface grid place-items-center text-[13px] font-semibold flex-none">
                    {toArabicDigits(i + 1)}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            {result.askTurns?.length > 0 && (
              <div className="flex flex-col gap-4 dashed-rule pt-6">
                <div className="text-[15px] font-semibold">أسئلة {child.name} للمعلم</div>
                {result.askTurns.map((t, i) => (
                  <div key={i} className="flex flex-col gap-1 text-[15px] leading-[1.6]">
                    <div className="font-semibold text-ink">{t.question || "…"}</div>
                    <div className="text-ink-2">{t.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div className="flex gap-3 items-center flex-wrap">
          <SketchButton href={`/lesson/${lesson.id}/session`} variant="white" size="xs">
            من البداية
          </SketchButton>
          <SketchPill href="/home">الرئيسية</SketchPill>
          <SketchPill href="/parent/pin">ولي الأمر</SketchPill>
        </div>
      </div>
    </Frame>
  );
}
