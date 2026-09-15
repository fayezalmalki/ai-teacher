"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "@/components/Frame";
import LookPicker from "@/components/LookPicker";
import { DEFAULT_LOOK } from "@/lib/character/looks";
import AppHeader, { AVATAR_BG } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import AccountSection from "@/components/parent/AccountSection";
import { SketchButton, SketchChip, SketchPill } from "@/components/Sketch";
import { PARENT_WEEK, SUBJECTS, type Tone } from "@/lib/content/catalog";
import { subjectPercent } from "@/lib/content/paths";
import { fill, fractionsLesson } from "@/lib/lesson-engine";
import { LESSON_LIST, lessonTitle } from "@/lib/lessons";
import { bestImprovement, lessonMastery, sessionRows, weekStats } from "@/lib/store/insights";
import { isParentUnlocked } from "@/lib/store/parent-gate";
import { initialOf } from "@/lib/store/state";
import { useAppStore, type ChildProfile } from "@/lib/store/app-store";

const BAR: Record<Tone, string> = { blue: "bg-primary", green: "bg-success", amber: "bg-yellow", neutral: "bg-ink" };
const RATING: Record<"green" | "amber", string> = { green: "text-success", amber: "text-warning" };

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex items-center gap-2.5 p-0 border-0 bg-transparent">
      <span
        className="relative inline-block w-[46px] h-[26px] rounded-[13px] ink-2 transition-colors duration-200 flex-none"
        style={{ background: on ? "var(--color-primary)" : "var(--color-surface)" }}
      >
        <span className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-surface ink-2 transition-[left] duration-200" style={{ left: on ? 22 : 2 }} />
      </span>
      <span className="text-[14px] text-ink-2">{label}</span>
    </button>
  );
}

function Stat({ v, k, className = "" }: { v: React.ReactNode; k: string; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className={"font-display text-[38px] font-bold leading-none " + className}>{v}</div>
      <div className="text-[13px] text-muted">{k}</div>
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const { state, child: active, updateChildSettings, removeChild, setActiveChild } = useAppStore();
  const [ready, setReady] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (isParentUnlocked()) setReady(true);
    else router.replace("/parent/pin");
  }, [router]);

  const child: ChildProfile = state.children.find((c) => c.id === viewId) ?? active;
  const name = child.name;
  const { settings, results } = child;
  const week = useMemo(() => weekStats(results), [results]);
  const rows = useMemo(() => sessionRows(results, lessonTitle), [results]);
  const improvement = bestImprovement(results, lessonTitle);
  const latest = rows[0]?.result ?? null;
  const setSettings = (patch: Partial<ChildProfile["settings"]>) => updateChildSettings(child.id, patch);

  if (!ready) {
    return (
      <Frame>
        <AppHeader />
      </Frame>
    );
  }

  // Phrased around the sessions, not the child, so it reads right for any name.
  const headline = results.length === 0 ? `ما بدأت جلسات ${name} بعد` : week.sessions >= 3 ? `${name} في تقدّم ثابت` : `${name} في بداية الطريق`;

  return (
    <Frame>
      <AppHeader backHref="/home" />
      <div className="flex-1 flex flex-col gap-10 px-6 sm:px-10 pt-12 pb-20 max-w-[820px] w-full mx-auto">
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div className="flex-[1_1_300px] min-w-0">
            <div className="text-[14px] text-muted">{PARENT_WEEK.eyebrow}</div>
            <h1 className="font-display text-[40px] font-bold mt-0.5 leading-[1.25] text-pretty-wrap m-0">{headline}</h1>
          </div>
          <SketchPill href="/home" className="text-[13px] px-3.5 py-2">
            واجهة الطالب
          </SketchPill>
        </div>

        {state.children.length > 1 && (
          <div className="flex gap-2.5 flex-wrap items-center" role="tablist" aria-label="الأطفال">
            {state.children.map((c) => (
              <SketchChip key={c.id} selected={c.id === child.id} onClick={() => { setViewId(c.id); setConfirmRemove(false); }} className="px-3.5 gap-2 text-[15px]">
                <span className={`w-6 h-6 r-chip-initial ink-2 grid place-items-center text-[12px] ${c.id === child.id ? "bg-surface text-ink" : AVATAR_BG[c.color]}`}>{initialOf(c.name)}</span>
                {c.name}
              </SketchChip>
            ))}
          </div>
        )}

        <div className="flex gap-9 flex-wrap">
          <Stat v={week.sessions} k="جلسات" />
          <Stat v={week.minutes} k="دقيقة تعلّم" />
          <Stat
            v={
              <>
                {week.correct}
                <span className="text-[20px] text-muted">/{week.questions}</span>
              </>
            }
            k="إجابات صحيحة"
          />
          <Stat v={improvement ? improvement.replace(/^درس /, "") : "—"} k="أبرز تحسّن" className={improvement ? "!text-[24px] !leading-[1.5] text-success" : "text-faint"} />
        </div>

        <div className="flex flex-col gap-[18px] dashed-rule pt-7">
          <div className="text-[15px] font-semibold">المواد</div>
          {SUBJECTS.map((s) => {
            const pct = subjectPercent(s.id, results);
            return (
              <div key={s.id} className="flex items-center gap-4">
                <div className="w-[140px] text-[15px] font-medium flex-none">{s.name}</div>
                <div className="flex-1 h-2.5 rounded-[5px] ink-2 overflow-hidden bg-surface">
                  <div className={"h-full " + BAR[s.tone]} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[13px] text-muted w-[90px] text-left flex-none">{pct === 0 ? "لم تبدأ" : `${pct}%`}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3.5 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">المستوى في كل درس</div>
          {LESSON_LIST.map((l) => {
            const m = lessonMastery(results, l.id);
            return (
              <div key={l.id} className="flex items-center gap-4 text-[15px]">
                <div className="w-[140px] font-medium flex-none">{l.title.replace(/^درس /, "")}</div>
                <div className="flex gap-1.5" aria-label={m.level ? `المستوى ${l.levels[m.level - 1]}` : "لم يبدأ"}>
                  {l.levels.map((label, i) => (
                    <span key={label} className={"w-[18px] h-[18px] r-dot ink-2 " + (m.level && i < m.level ? "bg-primary" : "bg-surface")} title={label} />
                  ))}
                </div>
                <div className="text-[13px] text-muted">
                  {m.level ? `${l.levels[m.level - 1]} · ${Math.round(m.ratio * 100)}% صحيح · ${m.sessions === 1 ? "جلسة واحدة" : m.sessions === 2 ? "جلستان" : `${m.sessions} جلسات`}` : "لم يبدأ"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3.5 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">آخر الجلسات</div>
          {rows.length === 0 && <div className="text-[15px] text-muted">ما فيه جلسات بعد. الملخص يظهر هنا بعد أول درس.</div>}
          {rows.slice(0, 6).map((se, i) => (
            <div key={i} className="flex justify-between items-center gap-3 text-[16px]">
              <div>
                <b className="font-semibold">{se.title}</b> <span className="text-muted text-[14px]">· {se.meta}</span>
              </div>
              <div className={"text-[13px] font-semibold flex-none " + RATING[se.tone]}>{se.rating}</div>
            </div>
          ))}
          {latest && latest.log.length > 0 && (
            <div className="text-[15px] text-ink-2 leading-[1.7] mt-1.5 px-[18px] py-3.5 border-2 border-dashed border-rule r-input">
              {latest.log.join(" ")}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">توصيات الأستاذ نواف</div>
          {PARENT_WEEK.recommendations.map((r) => (
            <div key={r} className="text-[16px] leading-[1.7]">
              · {fill(r, { name })}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 dashed-rule pt-7">
          <div className="text-[15px] font-semibold">إعدادات {name}</div>
          <div className="flex gap-7 flex-wrap items-center">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[14px] text-muted">مدة الجلسة</span>
              {PARENT_WEEK.durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={settings.dailyMinutes === d}
                  onClick={() => setSettings({ dailyMinutes: d })}
                  className={"px-3.5 py-2 r-small ink-2 text-[14px] font-semibold transition-colors " + (settings.dailyMinutes === d ? "bg-primary text-white" : "bg-surface text-ink hover:bg-hover")}
                >
                  {d} د
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[14px] text-muted">مستوى البداية</span>
              {fractionsLesson.levels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={settings.startLevel === i + 1}
                  onClick={() => setSettings({ startLevel: i + 1 })}
                  className={"px-3.5 py-2 r-chip ink-2 text-[14px] font-semibold transition-colors " + (settings.startLevel === i + 1 ? "bg-primary text-white" : "bg-surface text-ink hover:bg-hover")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[14px] text-muted">شكل الأستاذ نواف</span>
            <LookPicker value={settings.teacherLook ?? DEFAULT_LOOK} onChange={(teacherLook) => setSettings({ teacherLook })} size={60} />
          </div>
          <div className="flex gap-7 flex-wrap items-center">
            <Toggle on={settings.sound === "reading"} onClick={() => setSettings({ sound: settings.sound === "reading" ? "voice" : "reading" })} label="وضع القراءة (بدون صوت)" />
            <Toggle on={settings.liveAsk} onClick={() => setSettings({ liveAsk: !settings.liveAsk })} label="محادثة مفتوحة بعد الدرس" />
            <Toggle on={settings.reminder} onClick={() => setSettings({ reminder: !settings.reminder })} label={"تذكير يومي " + PARENT_WEEK.reminderTime} />
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <SketchPill href={`/onboarding?child=${child.id}`}>تعديل الاسم والصف</SketchPill>
            <SketchPill href="/onboarding?new=1">إضافة طالب</SketchPill>
            {child.id !== active.id && <SketchPill onClick={() => setActiveChild(child.id)}>اجعله الطالب الحالي</SketchPill>}
            {!confirmRemove ? (
              <SketchPill onClick={() => setConfirmRemove(true)} className="text-error">
                حذف {name}
              </SketchPill>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap text-[14px] text-ink-2">
                <span>يُحذف الملف وجلساته من هذا الجهاز.</span>
                <SketchButton size="xs" variant="white" onClick={() => setConfirmRemove(false)}>
                  تراجع
                </SketchButton>
                <SketchButton
                  size="xs"
                  onClick={() => {
                    removeChild(child.id);
                    setViewId(null);
                    setConfirmRemove(false);
                  }}
                  className="!bg-error"
                >
                  نعم، احذف
                </SketchButton>
              </div>
            )}
          </div>
        </div>

        <AccountSection />

        <Footer variant="slim" />
      </div>
    </Frame>
  );
}
