"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { SketchPill } from "@/components/Sketch";
import { PARENT_WEEK, SUBJECTS, type Tone } from "@/lib/content/catalog";
import { fill } from "@/lib/lesson-engine";
import { isParentUnlocked } from "@/lib/store/parent-gate";
import { useAppStore } from "@/lib/store/app-store";

const BAR: Record<Tone, string> = {
  blue: "bg-primary",
  green: "bg-success",
  amber: "bg-yellow",
  neutral: "bg-ink",
};

const RATING: Record<"green" | "amber", string> = {
  green: "text-success",
  amber: "text-warning",
};

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex items-center gap-2.5 p-0 border-0 bg-transparent">
      <span
        className="relative inline-block w-[46px] h-[26px] rounded-[13px] ink-2 transition-colors duration-200 flex-none"
        style={{ background: on ? "var(--color-primary)" : "var(--color-surface)" }}
      >
        <span
          className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-surface ink-2 transition-[left] duration-200"
          style={{ left: on ? 22 : 2 }}
        />
      </span>
      <span className="text-[14px] text-ink-2">{label}</span>
    </button>
  );
}

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
      <AppHeader backHref="/home" />
      <div className="flex-1 flex flex-col gap-10 px-6 sm:px-10 pt-12 pb-20 max-w-[820px] w-full mx-auto">
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div className="flex-[1_1_300px] min-w-0">
            <div className="text-[14px] text-muted">{PARENT_WEEK.eyebrow}</div>
            <h1 className="font-display text-[40px] font-bold mt-0.5 leading-[1.25] text-pretty-wrap m-0">{name} يتقدّم بثبات</h1>
          </div>
          <SketchPill href="/home" className="text-[13px] px-3.5 py-2">
            واجهة الطالب
          </SketchPill>
        </div>

        <div className="flex gap-9 flex-wrap">
          {PARENT_WEEK.stats.map((s) => (
            <div key={s.k} className="flex flex-col gap-0.5">
              <div className="font-display text-[38px] font-bold leading-none">{s.v}</div>
              <div className="text-[13px] text-muted">{s.k}</div>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <div className="font-display text-[24px] font-bold leading-[1.5] text-success">{PARENT_WEEK.highlight.v}</div>
            <div className="text-[13px] text-muted">{PARENT_WEEK.highlight.k}</div>
          </div>
        </div>

        <div className="flex flex-col gap-[18px] dashed-rule pt-7">
          <div className="text-[15px] font-semibold">المواد</div>
          {SUBJECTS.map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className="w-[140px] text-[15px] font-medium flex-none">{s.name}</div>
              <div className="flex-1 h-2.5 rounded-[5px] ink-2 overflow-hidden bg-surface">
                <div className={"h-full " + BAR[s.tone]} style={{ width: `${s.pct}%` }} />
              </div>
              <div className="text-[13px] text-muted w-[90px] text-left flex-none">{s.meta}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3.5 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">آخر الجلسات</div>
          {PARENT_WEEK.sessions.map((se) => (
            <div key={se.title} className="flex justify-between items-center gap-3 text-[16px]">
              <div>
                <b className="font-semibold">{se.title}</b> <span className="text-muted text-[14px]">· {se.meta}</span>
              </div>
              <div className={"text-[13px] font-semibold flex-none " + RATING[se.tone]}>{se.rating}</div>
            </div>
          ))}
          <div className="text-[15px] text-ink-2 leading-[1.7] mt-1.5 px-[18px] py-3.5 border-2 border-dashed border-rule r-input">
            {fill(PARENT_WEEK.narrative, { name })}
          </div>
        </div>

        <div className="flex flex-col gap-3 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">توصيات الأستاذ نواف</div>
          {PARENT_WEEK.recommendations.map((r) => (
            <div key={r} className="text-[16px] leading-[1.7]">
              · {fill(r, { name })}
            </div>
          ))}
        </div>

        <div className="flex gap-7 flex-wrap items-center dashed-rule pt-7">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[14px] text-muted">مدة الجلسة</span>
            {PARENT_WEEK.durations.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={settings.dailyMinutes === d}
                onClick={() => setSettings({ dailyMinutes: d })}
                className={
                  "px-3.5 py-2 r-small ink-2 text-[14px] font-semibold transition-colors " +
                  (settings.dailyMinutes === d ? "bg-primary text-white" : "bg-surface text-ink hover:bg-hover")
                }
              >
                {d} د
              </button>
            ))}
          </div>
          <Toggle on={settings.liveAsk} onClick={() => setSettings({ liveAsk: !settings.liveAsk })} label="محادثة مفتوحة بعد الدرس" />
          <Toggle
            on={settings.reminder}
            onClick={() => setSettings({ reminder: !settings.reminder })}
            label={"تذكير يومي " + PARENT_WEEK.reminderTime}
          />
        </div>

        <Footer variant="slim" />
      </div>
    </Frame>
  );
}
