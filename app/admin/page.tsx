"use client";

/**
 * Admin page: who tried the app (usage events from every device), who signed
 * in (households and their sessions), and the demo gate. Sign in with the
 * parent email flow; only emails listed in the deployment's ADMIN_EMAILS see
 * the data. Not linked from the app; robots disallow it.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import EmailCodeForm from "@/components/parent/EmailCodeForm";
import { SketchButton, SketchChip, SketchPill } from "@/components/Sketch";
import { useAccount } from "@/lib/convex/account";
import { lessonTitle } from "@/lib/lessons";
import { relativeDay } from "@/lib/store/insights";

const RANGES = [7, 30, 90];

export default function AdminPage() {
  const acct = useAccount();
  return (
    <Frame>
      <AppHeader backHref="/" showSubjects={false} />
      <div className="flex-1 flex flex-col gap-9 px-6 sm:px-10 pt-10 pb-20 max-w-[1040px] w-full mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[13px] text-muted">المعلم الذكي · المشرف</div>
            <h1 className="font-display text-[40px] font-bold m-0 leading-tight">لوحة المتابعة</h1>
          </div>
          {acct.account && (
            <div className="flex items-center gap-3 text-[14px] text-muted">
              <span dir="ltr">{acct.account.email}</span>
              <SketchPill onClick={() => acct.signOut()}>خروج</SketchPill>
            </div>
          )}
        </div>
        {!acct.enabled ? (
          <p className="text-[16px] text-ink-2 m-0">هذا النشر بدون Convex، فلا توجد بيانات استخدام هنا.</p>
        ) : !acct.account ? (
          <EmailCodeForm intro="سجّل ببريد المشرف لعرض الاستخدام والتحكم في بوابة النموذج." />
        ) : (
          <Dashboard token={acct.account.token} />
        )}
      </div>
    </Frame>
  );
}

function Dashboard({ token }: { token: string }) {
  const [days, setDays] = useState(7);
  const who = useQuery(api.admin.whoami, { token });
  const data = useQuery(api.admin.overview, who?.admin ? { token, days } : "skip");
  const households = useQuery(api.admin.households, who?.admin ? { token } : "skip");
  const sessions = useQuery(api.admin.recentSessions, who?.admin ? { token } : "skip");

  if (who === undefined) return <p className="text-[15px] text-muted m-0">يحمّل…</p>;
  if (!who) return <p className="text-[15px] text-error m-0">انتهت الجلسة. سجّل الدخول مرة ثانية.</p>;
  if (!who.admin) {
    return (
      <div className="flex flex-col gap-2 text-[15px] text-ink-2">
        <p className="m-0">
          البريد <span dir="ltr">{who.email}</span> ليس من المشرفين.
        </p>
        {!who.configured && (
          <p className="m-0 text-muted">
            لم يُضبط أي مشرف بعد: أضف <code className="text-[13px]">ADMIN_EMAILS</code> في إعدادات Convex.
          </p>
        )}
      </div>
    );
  }
  if (!data) return <p className="text-[15px] text-muted m-0">يحمّل الأرقام…</p>;

  const t = data.usage.totals;
  const kpis: { label: string; value: number; hint?: string }[] = [
    { label: "زيارات", value: t.visits, hint: "جلسة متصفح" },
    { label: "أجهزة", value: t.devices, hint: `${t.mobile} جوال · ${t.desktop} حاسب` },
    { label: "أجهزة جديدة", value: t.newDevices, hint: "أول مرة" },
    { label: "أكملوا الإعداد", value: t.onboarded },
    { label: "دروس بدأت", value: t.lessonStarts },
    { label: "دروس اكتملت", value: t.lessonEnds, hint: t.lessonStarts ? `${Math.round((t.lessonEnds / t.lessonStarts) * 100)}% إكمال` : undefined },
    { label: "أولياء أمور مسجّلون", value: data.accounts.households, hint: `${data.accounts.newHouseholds} جدد في الفترة` },
    { label: "جلسات محفوظة", value: data.accounts.results, hint: `${data.accounts.newResults} في الفترة` },
  ];

  return (
    <div className="flex flex-col gap-9">
      <GatePanel token={token} gate={data.gate} />

      <section className="flex flex-col gap-4 dashed-rule pt-7">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display text-[24px] font-bold m-0">الاستخدام</h2>
          <div className="flex gap-2">
            {RANGES.map((d) => (
              <SketchChip key={d} selected={days === d} onClick={() => setDays(d)} className="px-3.5 text-[14px]">
                {d} يوم
              </SketchChip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="px-4 py-3.5 r-card-2 ink-2 bg-surface flex flex-col gap-0.5">
              <div className="font-display text-[32px] font-bold leading-none tabular-nums">{k.value}</div>
              <div className="text-[14px] font-semibold">{k.label}</div>
              {k.hint && <div className="text-[12px] text-muted">{k.hint}</div>}
            </div>
          ))}
        </div>
        <DailyChart rows={data.usage.daily} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 text-[14px]">
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold">الدروس</div>
            {data.usage.lessons.length === 0 && <div className="text-muted">لا شيء بعد.</div>}
            {data.usage.lessons.map((l) => (
              <div key={l.lessonId} className="flex justify-between gap-3">
                <span>{lessonTitle(l.lessonId).replace(/^درس /, "")}</span>
                <span className="text-muted tabular-nums">
                  {l.starts} بدأ · {l.ends} اكتمل
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold">الصفحات</div>
            {data.usage.pages.map((p) => (
              <div key={p.path} className="flex justify-between gap-3">
                <span dir="ltr" className="text-left">{p.path}</span>
                <span className="text-muted tabular-nums">{p.views}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold">المصدر</div>
            {data.usage.referrers.length === 0 && <div className="text-muted">مباشر فقط.</div>}
            {data.usage.referrers.map((r) => (
              <div key={r.ref} className="flex justify-between gap-3">
                <span dir="ltr" className="text-left">{r.ref}</span>
                <span className="text-muted tabular-nums">{r.visits}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 dashed-rule pt-7">
        <h2 className="font-display text-[24px] font-bold m-0">أولياء الأمور المسجّلون</h2>
        {!households ? (
          <div className="text-[14px] text-muted">يحمّل…</div>
        ) : households.length === 0 ? (
          <div className="text-[14px] text-muted">لم يسجّل أحد بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse min-w-[560px]">
              <thead>
                <tr className="text-muted text-[12px]">
                  <th className="text-right font-semibold py-2">البريد</th>
                  <th className="text-right font-semibold py-2">الأطفال</th>
                  <th className="text-right font-semibold py-2">جلسات</th>
                  <th className="text-right font-semibold py-2">سجّل</th>
                  <th className="text-right font-semibold py-2">آخر مزامنة</th>
                </tr>
              </thead>
              <tbody>
                {households.map((h) => (
                  <tr key={h.email} className="border-t border-rule">
                    <td className="py-2" dir="ltr">
                      <span className="block text-right">{h.email}</span>
                    </td>
                    <td className="py-2">{h.children.length ? h.children.map((c) => `${c.name} (${c.grade})`).join("، ") : "—"}</td>
                    <td className="py-2 tabular-nums">{h.sessions}</td>
                    <td className="py-2 text-muted">{relativeDay(h.createdAt)}</td>
                    <td className="py-2 text-muted">{h.lastSyncAt ? relativeDay(h.lastSyncAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 dashed-rule pt-7">
        <h2 className="font-display text-[24px] font-bold m-0">آخر الجلسات المحفوظة</h2>
        {!sessions ? (
          <div className="text-[14px] text-muted">يحمّل…</div>
        ) : sessions.length === 0 ? (
          <div className="text-[14px] text-muted">لا جلسات محفوظة بعد. تظهر هنا جلسات الأطفال في الحسابات المسجّلة.</div>
        ) : (
          <div className="flex flex-col gap-2 text-[14px]">
            {sessions.map((s, i) => (
              <div key={i} className="flex justify-between gap-3 flex-wrap">
                <span>
                  <b className="font-semibold">{s.childName}</b> · {lessonTitle(s.lessonId).replace(/^درس /, "")} · {s.correct}/{s.questions} · {s.rating}
                </span>
                <span className="text-muted">
                  {relativeDay(s.endedAt)} · <span dir="ltr">{s.email}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="text-[12px] text-muted">آخر تحديث {new Date(data.generatedAt).toLocaleTimeString("ar-SA")} · الأيام تُقطع على توقيت الرياض.</div>
    </div>
  );
}

function DailyChart({ rows }: { rows: { day: string; visits: number; devices: number; starts: number; ends: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.visits, r.starts)));
  const w = 720;
  const h = 150;
  const pad = 24;
  const bw = (w - pad * 2) / rows.length;
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h + 26}`} width="100%" style={{ minWidth: 360, direction: "ltr" }} role="img" aria-label="زيارات ودروس بدأت في كل يوم">
          {[0.5, 1].map((f) => (
            <line key={f} x1={pad} x2={w - pad} y1={h - f * (h - 20)} y2={h - f * (h - 20)} stroke="var(--color-rule)" strokeDasharray="4 4" />
          ))}
          {rows.map((r, i) => {
            const x = pad + i * bw;
            const vh = (r.visits / max) * (h - 20);
            const sh = (r.starts / max) * (h - 20);
            const showLabel = rows.length <= 14 || i % Math.ceil(rows.length / 10) === 0;
            return (
              <g key={r.day}>
                <rect x={x + bw * 0.15} y={h - vh} width={bw * 0.32} height={vh} fill="var(--color-primary)" rx="2" />
                <rect x={x + bw * 0.52} y={h - sh} width={bw * 0.32} height={sh} fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="1" rx="2" />
                {showLabel && (
                  <text x={x + bw / 2} y={h + 16} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
                    {r.day.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
          <text x={pad} y={12} fontSize="10" fill="var(--color-muted)">
            {max}
          </text>
        </svg>
      </div>
      <figcaption className="text-[12px] text-muted flex gap-4">
        <span>
          <span className="inline-block w-3 h-3 align-middle rounded-[3px] bg-primary ml-1" />
          زيارات
        </span>
        <span>
          <span className="inline-block w-3 h-3 align-middle rounded-[3px] bg-yellow ink-2 ml-1" />
          دروس بدأت
        </span>
      </figcaption>
    </figure>
  );
}

function GatePanel({ token, gate }: { token: string; gate: { mode: string; code: string; message: string } }) {
  const setGate = useMutation(api.gate.set);
  const [mode, setMode] = useState(gate.mode);
  const [code, setCode] = useState(gate.code);
  const [message, setMessage] = useState(gate.message);
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    setMode(gate.mode);
    setCode(gate.code);
    setMessage(gate.message);
  }, [gate.mode, gate.code, gate.message]);
  const dirty = mode !== gate.mode || code !== gate.code || message !== gate.message;
  const modes: { id: string; label: string; hint: string }[] = [
    { id: "open", label: "مفتوح", hint: "أي زائر يدخل" },
    { id: "code", label: "برمز دخول", hint: "يطلب رمزًا مرة واحدة لكل جهاز" },
    { id: "closed", label: "مغلق", hint: "رسالة فقط ورابط التواصل" },
  ];
  const save = async () => {
    setStatus(null);
    try {
      await setGate({ token, mode, code, message });
      setStatus("تم الحفظ. يسري على كل الزوار فورًا.");
    } catch (e) {
      setStatus((e as Error).message.includes("code") ? "اكتب رمز الدخول أولًا." : "تعذّر الحفظ.");
    }
  };
  const live = modes.find((m) => m.id === gate.mode)?.label ?? gate.mode;
  return (
    <section className="flex flex-col gap-4 px-5 py-5 r-card-1 ink bg-surface shadow-tint-yellow">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-[24px] font-bold m-0">بوابة النموذج</h2>
        <span className={"text-[13px] font-semibold px-3 py-1 rounded-full ink-2 " + (gate.mode === "open" ? "bg-success-tint" : gate.mode === "code" ? "bg-yellow" : "bg-error text-white")}>
          الآن: {live}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="وضع البوابة">
        {modes.map((m) => (
          <SketchChip key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)} className="px-4 text-[15px]" role="radio" aria-checked={mode === m.id} data-mode={m.id}>
            {m.label}
          </SketchChip>
        ))}
        <span className="text-[13px] text-muted self-center">{modes.find((m) => m.id === mode)?.hint}</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {mode === "code" && (
          <input
            id="gate-code-admin"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="رمز الدخول"
            aria-label="رمز الدخول"
            className="min-w-0 w-[200px] px-4 py-3 r-input ink-2 bg-surface text-[17px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
          />
        )}
        {mode !== "open" && (
          <input
            id="gate-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={mode === "closed" ? "النموذج مغلق حاليًا. نرجع قريبًا." : "النموذج متاح بدعوة. أدخل رمز الدخول للمتابعة."}
            aria-label="رسالة البوابة"
            className="min-w-0 flex-1 px-4 py-3 r-input ink-2 bg-surface text-[15px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
          />
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <SketchButton size="sm" onClick={save} disabled={!dirty}>
          حفظ
        </SketchButton>
        {status && <span className="text-[14px] text-ink-2">{status}</span>}
        {!dirty && !status && <span className="text-[13px] text-muted">صفحة المشرف هذه لا تُغلق أبدًا.</span>}
      </div>
    </section>
  );
}
