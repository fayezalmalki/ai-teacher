"use client";

import { useParams } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import LessonNotFound from "@/components/LessonNotFound";
import { getLesson, summaryStats } from "@/lib/lesson-engine";
import { useAppStore } from "@/lib/store/app-store";

/** Parent / investor summary of the last session: 6 stat tiles + adaptation log. */
export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  const { state, hydrated } = useAppStore();
  if (!lesson) return <LessonNotFound />;
  const result = state.lastResult && state.lastResult.lessonId === lesson.id ? state.lastResult : null;

  return (
    <Frame>
      <AppHeader showChild backHref="/home" />
      <div className="flex-1 px-8 py-10 flex flex-col gap-7">
        <div>
          <div className="text-[14px] text-muted">ملخص للوالدين</div>
          <h1 className="text-[30px] font-bold mt-1 m-0">ملخص جلسة {state.child.name}</h1>
        </div>
        {hydrated && !result && (
          <div className="rounded-card bg-surface-2 p-6 text-[15px] text-ink-2">
            ما فيه جلسة مكتملة بعد. ابدأ الدرس أولًا وبعدها يظهر الملخص هنا.
          </div>
        )}
        {result && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              {summaryStats(result, lesson).map((s) => (
                <div key={s.k} className="rounded-tile bg-surface-2 px-5 py-[18px]">
                  <div className="text-[13px] text-muted">{s.k}</div>
                  <div className="text-[24px] font-bold mt-1">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-card border border-border p-6">
              <div className="text-[18px] font-semibold mb-4">كيف تكيّف المعلم؟</div>
              <div className="flex flex-col gap-3.5">
                {result.log.map((t, i) => (
                  <div key={i} className="flex gap-3.5 items-start text-[16px] leading-[1.55]">
                    <span className="w-7 h-7 rounded-full bg-primary-tint text-primary grid place-items-center font-semibold text-[14px] flex-none">
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex gap-3 flex-wrap">
          <Button href={`/lesson/${lesson.id}/session`} variant="secondary" className="px-6 py-3.5 text-[16px]">
            إعادة العرض من البداية
          </Button>
          <Button href="/home" variant="secondary" className="px-6 py-3.5 text-[16px]">
            العودة للرئيسية
          </Button>
          <Button href="/parent/pin" variant="pill" className="px-4 py-3.5 text-[14px]">
            منطقة ولي الأمر
          </Button>
        </div>
      </div>
    </Frame>
  );
}
