"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import { TONE_BAR } from "@/components/SubjectTile";
import { PARENT_WEEK, SUBJECTS } from "@/lib/content/catalog";
import { fill } from "@/lib/lesson-engine";
import { isParentUnlocked } from "@/lib/store/parent-gate";
import { useAppStore } from "@/lib/store/app-store";

const RATING_TONE = {
  green: "bg-success-tint text-success",
  amber: "bg-warning-tint text-warning",
};

export default function ParentPage() {
  const router = useRouter();
  const { state, setSettings } = useAppStore();
  const [ready, setReady] = useState(false);
  const name = state.child.name;

  useEffect(() => {
    if (isParentUnlocked()) setReady(true);
    else router.replace("/parent/pin");
  }, [router]);

  if (!ready) {
    return (
      <Frame>
        <AppHeader />
      </Frame>
    );
  }

  const { settings } = state;

  return (
    <Frame>
      <AppHeader />
      <div className="flex-1 flex flex-col gap-8 px-8 py-10">
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div className="flex-[1_1_320px] min-w-0">
            <div className="text-[14px] text-muted">{PARENT_WEEK.eyebrow}</div>
            <h1 className="text-[32px] font-bold mt-1 leading-[1.3] text-pretty-wrap m-0">{name} يتقدّم بثبات</h1>
          </div>
          <Button href="/home" variant="pill" className="px-4 py-2.5 text-[13px]">
            العودة لواجهة الطالب
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {PARENT_WEEK.stats.map((s) => (
            <div key={s.k} className="rounded-tile bg-surface-2 px-5 py-[18px]">
              <div className="text-[13px] text-muted">{s.k}</div>
              <div className="text-[26px] font-bold mt-1">{s.v}</div>
            </div>
          ))}
          <div className="rounded-tile bg-success-tint px-5 py-[18px]">
            <div className="text-[13px] text-success">{PARENT_WEEK.highlight.k}</div>
            <div className="text-[20px] font-bold mt-1.5 text-success">{PARENT_WEEK.highlight.v}</div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          <div className="rounded-card border border-border p-6 flex flex-col gap-[18px]">
            <div className="text-[18px] font-semibold">التقدّم في المواد</div>
            {SUBJECTS.map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <div className="flex justify-between text-[15px]">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted">{s.meta}</span>
                </div>
                <div className="h-2 rounded-[4px] bg-border overflow-hidden">
                  <div className={"h-full rounded-[4px] " + TONE_BAR[s.tone]} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-border p-6 flex flex-col gap-3.5">
            <div className="text-[18px] font-semibold">آخر الجلسات</div>
            {PARENT_WEEK.sessions.map((se) => (
              <div key={se.title} className="flex justify-between items-center gap-3 py-3.5 border-b border-row">
                <div>
                  <div className="text-[16px] font-medium">{se.title}</div>
                  <div className="text-[13px] text-muted mt-0.5">{se.meta}</div>
                </div>
                <div className={"text-[13px] font-medium px-3 py-1.5 rounded-pill flex-none " + RATING_TONE[se.tone]}>{se.rating}</div>
              </div>
            ))}
            <div className="text-[14px] text-ink-2 leading-[1.6] bg-surface-2 rounded-input px-4 py-3.5">
              {fill(PARENT_WEEK.narrative, { name })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          <div className="rounded-card bg-surface-2 p-6 flex flex-col gap-3.5">
            <div className="text-[18px] font-semibold">توصيات الأستاذ نواف</div>
            <div className="flex flex-col gap-2.5">
              {PARENT_WEEK.recommendations.map((r) => (
                <div key={r} className="flex gap-2.5 text-[15px] leading-[1.6]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-none" />
                  <span>{fill(r, { name })}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-card border border-border p-6 flex flex-col gap-[18px]">
            <div className="text-[18px] font-semibold">إعدادات بسيطة</div>
            <div className="flex flex-col gap-2">
              <div className="text-[14px] text-ink-2">مدة الجلسة اليومية</div>
              <div className="flex gap-2">
                {PARENT_WEEK.durations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSettings({ dailyMinutes: d })}
                    className={
                      "px-4 py-2.5 rounded-chip border-2 text-[14px] font-semibold " +
                      (settings.dailyMinutes === d ? "border-primary bg-primary-tint text-primary" : "border-border-2 bg-surface text-ink")
                    }
                  >
                    {d} دقائق
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.liveAsk}
              onClick={() => setSettings({ liveAsk: !settings.liveAsk })}
              className="flex justify-between items-center gap-3 p-0 border-0 bg-transparent text-right"
            >
              <div>
                <div className="text-[15px] font-medium text-ink">محادثة مفتوحة مع المعلم</div>
                <div className="text-[13px] text-muted">بعد الدرس، يقدر {name} يسأل الأستاذ نواف بصوته لدقيقتين</div>
              </div>
              <div
                className="w-12 h-7 rounded-[14px] relative transition-colors duration-200 flex-none"
                style={{ background: settings.liveAsk ? "var(--color-primary)" : "var(--color-border-dashed)" }}
              >
                <div
                  className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-[left] duration-200"
                  style={{ left: settings.liveAsk ? 23 : 3 }}
                />
              </div>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reminder}
              onClick={() => setSettings({ reminder: !settings.reminder })}
              className="flex justify-between items-center gap-3 p-0 border-0 bg-transparent text-right"
            >
              <div>
                <div className="text-[15px] font-medium text-ink">تذكير يومي</div>
                <div className="text-[13px] text-muted">{PARENT_WEEK.reminderTime}</div>
              </div>
              <div
                className="w-12 h-7 rounded-[14px] relative transition-colors duration-200 flex-none"
                style={{ background: settings.reminder ? "var(--color-primary)" : "var(--color-border-dashed)" }}
              >
                <div
                  className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-[left] duration-200"
                  style={{ left: settings.reminder ? 23 : 3 }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
