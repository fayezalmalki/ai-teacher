"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Toast from "@/components/Toast";
import { LESSONS, SUBJECTS, TOAST_DONE, TOAST_LOCKED, gradeLabel, type LessonStatus } from "@/lib/content/catalog";
import { TOAST_MS } from "@/lib/lesson-engine/timing";
import { useAppStore } from "@/lib/store/app-store";

const TAG: Record<LessonStatus, { label: string; cls: string }> = {
  done: { label: "مكتمل", cls: "bg-success-tint text-success" },
  today: { label: "درس اليوم", cls: "bg-primary-tint text-primary" },
  next: { label: "التالي", cls: "bg-primary-tint text-primary" },
  later: { label: "لاحقًا", cls: "bg-surface-3 text-muted" },
};

export default function SubjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useAppStore();
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
      <AppHeader showChild showParent />
      <div className="flex-1 flex flex-col gap-7 px-8 py-10">
        <div>
          <div className="text-[14px] text-muted">{gradeLabel(state.child.grade)}</div>
          <h1 className="text-[32px] font-bold mt-1 m-0">{subject.name}</h1>
        </div>
        <div className="flex flex-col max-w-[640px]">
          {lessons.map((l, i) => {
            const st = l.status;
            const live = !!l.lessonId && st === "today";
            const highlighted = st === "today" || st === "next";
            const dot =
              st === "done"
                ? "bg-success text-white border-transparent"
                : highlighted
                  ? "bg-primary text-white border-transparent"
                  : "bg-surface text-faint border-border-2";
            const onOpen = () => {
              if (live) router.push(`/lesson/${l.lessonId}`);
              else if (st === "done") showToast(TOAST_DONE);
              else showToast(TOAST_LOCKED);
            };
            return (
              <div key={l.title} className="flex gap-[18px] items-stretch">
                <div className="flex flex-col items-center w-9">
                  <div className={"w-9 h-9 rounded-full grid place-items-center text-[15px] font-semibold border-2 flex-none " + dot}>
                    {st === "done" ? "✓" : i + 1}
                  </div>
                  {i < lessons.length - 1 && <div className="flex-1 w-0.5 bg-border" />}
                </div>
                <button
                  type="button"
                  onClick={onOpen}
                  className={
                    "flex-1 text-right mb-3.5 px-5 py-[18px] rounded-[18px] border-2 flex justify-between items-center gap-3 hover:border-primary " +
                    (highlighted ? "border-primary bg-primary-tint-2" : "border-border bg-surface")
                  }
                  style={{ opacity: st === "later" ? 0.6 : 1 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[18px] font-semibold text-ink">{l.title}</div>
                    <div className="text-[13px] text-muted mt-0.5">{l.meta}</div>
                  </div>
                  <div className={"text-[13px] font-medium px-3 py-1.5 rounded-pill flex-none " + TAG[st].cls}>{TAG[st].label}</div>
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
