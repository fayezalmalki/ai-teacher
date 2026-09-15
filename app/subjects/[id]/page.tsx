"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Toast from "@/components/Toast";
import { LESSONS, SUBJECTS, TOAST_DONE, TOAST_LOCKED, type LessonStatus } from "@/lib/content/catalog";
import { toArabicDigits } from "@/lib/format";
import { TOAST_MS } from "@/lib/lesson-engine/timing";

const TAG: Record<LessonStatus, { label: string; cls: string }> = {
  done: { label: "مكتمل", cls: "text-success" },
  today: { label: "درس اليوم", cls: "text-primary" },
  next: { label: "التالي", cls: "text-primary" },
  later: { label: "لاحقًا", cls: "text-muted" },
};

export default function SubjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const subject = SUBJECTS.find((s) => s.id === params.id) ?? SUBJECTS[0];
  const lessons = LESSONS[subject.id] ?? [];
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const showToast = (t: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(""), TOAST_MS);
  };

  return (
    <Frame>
      <AppHeader showChild showParent backHref="/home" />
      <div className="flex-1 flex flex-col gap-8 px-6 sm:px-10 pt-12 pb-20 max-w-[720px] w-full mx-auto">
        <h1 className="font-display text-[44px] font-bold m-0">{subject.name}</h1>
        <div className="flex flex-col">
          {lessons.map((l, i) => {
            const st = l.status;
            const live = !!l.lessonId && st === "today";
            const highlighted = st === "today" || st === "next";
            const dot =
              st === "done"
                ? "bg-success text-white"
                : highlighted
                  ? "bg-primary text-white"
                  : "bg-surface text-faint";
            const onOpen = () => {
              if (live) router.push(`/lesson/${l.lessonId}`);
              else if (st === "done") showToast(TOAST_DONE);
              else showToast(TOAST_LOCKED);
            };
            return (
              <div key={l.title} className="flex gap-[18px] items-stretch">
                <div className="flex flex-col items-center w-[34px]">
                  <div className={"w-[34px] h-[34px] r-dot ink-2 grid place-items-center font-display text-[16px] font-bold flex-none " + dot}>
                    {st === "done" ? "✓" : toArabicDigits(i + 1)}
                  </div>
                  {i < lessons.length - 1 && <div className="flex-1 w-0 border-r-2 border-dashed border-rule" />}
                </div>
                <button
                  type="button"
                  onClick={onOpen}
                  className={
                    "flex-1 text-right mb-4 px-5 py-4 r-row flex justify-between items-center gap-3 transition-[transform,box-shadow] duration-150 " +
                    (highlighted
                      ? "ink bg-surface shadow-tint-blue hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-sm"
                      : "ink-2 bg-transparent hover:bg-hover")
                  }
                  style={{ opacity: st === "later" ? 0.6 : 1 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[20px] font-bold text-ink">{l.title}</div>
                    {l.meta && <div className="text-[13px] text-muted mt-0.5">{l.meta}</div>}
                  </div>
                  <div className={"text-[13px] font-semibold flex-none " + TAG[st].cls}>{TAG[st].label}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <Toast message={toast} />
    </Frame>
  );
}
