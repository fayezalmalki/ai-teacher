"use client";

import Link from "next/link";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import { TONE_BAR, TONE_TILE } from "@/components/SubjectTile";
import { HOME_TODAY_LINE, LAST_SESSION, SUBJECTS, TODAY_LESSON, gradeLabel } from "@/lib/content/catalog";
import { useAppStore } from "@/lib/store/app-store";

export default function HomePage() {
  const { state } = useAppStore();
  return (
    <Frame>
      <AppHeader showChild showParent />
      <div className="flex-1 flex flex-col gap-9 px-8 py-10">
        <div>
          <h1 className="text-[34px] font-bold m-0">هلا {state.child.name} 👋</h1>
          <div className="text-[17px] text-ink-2 mt-1">{HOME_TODAY_LINE}</div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 items-stretch">
          <Link
            href={`/lesson/${TODAY_LESSON.lessonId}`}
            className="text-right border-0 rounded-frame bg-primary text-white p-[30px] flex flex-col gap-[18px] justify-between shadow-today hover:bg-primary-hover hover:text-white"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-[13px] opacity-85">{TODAY_LESSON.eyebrow}</div>
                <div className="text-[30px] font-bold mt-1.5">{TODAY_LESSON.title}</div>
                <div className="text-[15px] opacity-90 mt-1">{TODAY_LESSON.meta}</div>
              </div>
              <div className="w-[60px] h-[60px] rounded-full bg-white/18 grid place-items-center text-[26px] font-bold flex-none">ن</div>
            </div>
            <div className="inline-flex items-center gap-2.5 px-[18px] py-3 rounded-pill bg-surface text-primary text-[15px] font-semibold self-start">
              {TODAY_LESSON.cta}
            </div>
          </Link>
          <div className="rounded-frame bg-surface-2 p-[26px] flex flex-col gap-3.5">
            <div className="text-[14px] text-muted">آخر جلسة</div>
            <div className="text-[19px] font-semibold leading-[1.5]">{LAST_SESSION.title}</div>
            <div className="text-[15px] text-ink-2 leading-[1.6]">
              فهمك كان <b className="text-success font-semibold">{LAST_SESSION.ratingWord}</b>. الأستاذ نواف قال: &quot;{LAST_SESSION.quote}&quot;
            </div>
            <div className="flex gap-1.5 mt-auto">
              {LAST_SESSION.streak.map((v, i) => (
                <div key={i} className={"w-[26px] h-[26px] rounded-lg " + (v ? "bg-primary" : "bg-border")} />
              ))}
            </div>
            <div className="text-[13px] text-muted">{LAST_SESSION.streakLabel}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="text-[18px] font-semibold">موادك · {gradeLabel(state.child.grade)}</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            {SUBJECTS.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className="text-right border border-border rounded-card bg-surface p-[22px] flex flex-col gap-3.5 text-ink hover:border-primary hover:bg-primary-tint-2 hover:text-ink"
              >
                <div className={"w-11 h-11 rounded-input grid place-items-center text-[18px] font-bold " + TONE_TILE[s.tone]}>{s.glyph}</div>
                <div>
                  <div className="text-[18px] font-semibold">{s.name}</div>
                  <div className="text-[13px] text-muted mt-0.5">{s.meta}</div>
                </div>
                <div className="h-1.5 rounded-[3px] bg-border w-full overflow-hidden">
                  <div className={"h-full rounded-[3px] " + TONE_BAR[s.tone]} style={{ width: `${s.pct}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}
