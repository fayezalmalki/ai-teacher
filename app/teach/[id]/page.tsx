"use client";

/**
 * One class: the join code, the roster, "send a lesson" links, and for each
 * sent lesson who finished it and how it went.
 */
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import ShareLink from "@/components/ShareLink";
import EmailCodeForm from "@/components/parent/EmailCodeForm";
import { SketchButton, SketchChip, SketchPill } from "@/components/Sketch";
import { gradeLabel } from "@/lib/content/catalog";
import { useAccount } from "@/lib/convex/account";
import { joinUrl } from "@/lib/links/code";
import { LESSON_LIST, lessonTitle } from "@/lib/lessons";
import { relativeDay } from "@/lib/store/insights";

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const acct = useAccount();
  return (
    <Frame>
      <AppHeader backHref="/teach" showSubjects={false} />
      <div className="flex-1 flex flex-col gap-8 px-6 sm:px-10 pt-10 pb-20 max-w-[1040px] w-full mx-auto">
        {!acct.enabled ? null : !acct.account ? <EmailCodeForm intro="سجّل ببريد المعلم لعرض هذا الصف." /> : <Room token={acct.account.token} id={id as Id<"classrooms">} />}
      </div>
    </Frame>
  );
}

type Result = { studentId: string; lessonId: string; questions: number; correct: number; reexplain: number; startDifficulty: number; endDifficulty: number; rating: string; endedAt: number; createdAt: number };

function Room({ token, id }: { token: string; id: Id<"classrooms"> }) {
  const room = useQuery(api.classroom.get, { token, classroomId: id });
  const assign = useMutation(api.classroom.assign);
  const removeStudent = useMutation(api.classroom.removeStudent);
  const [lessonId, setLessonId] = useState(LESSON_LIST[0].id);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const byStudentLesson = useMemo(() => {
    const m = new Map<string, Result[]>();
    for (const r of room?.results ?? []) {
      const k = r.studentId + ":" + r.lessonId;
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return m;
  }, [room?.results]);

  if (room === undefined) return <div className="text-[14px] text-muted">يحمّل…</div>;
  if (room === null) return <div className="text-[14px] text-error">هذا الصف ليس لك.</div>;

  const send = async () => {
    setBusy(true);
    try {
      const r = await assign({ token, classroomId: id, lessonId, note });
      setOpenId(r.id);
      setNote("");
    } finally {
      setBusy(false);
    }
  };

  const levelName = (n: number) => LESSON_LIST[0].levels[Math.max(0, Math.min(2, n - 1))];

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-1.5">
        <div className="text-[13px] text-muted">
          {room.teacherName} · {gradeLabel(room.grade)}
        </div>
        <h1 className="font-display text-[40px] font-bold m-0 leading-tight">{room.name}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[22px] font-bold m-0">رمز الصف</h2>
        <p className="text-[14px] text-ink-2 m-0 max-w-[560px]">يكتبه الطالب مرة واحدة في school.mvp.sa/j أو يفتح الرابط. بعدها كل درس يخلصه يوصلك هنا.</p>
        <ShareLink url={joinUrl(origin, room.code)} code={room.code} message={`انضم لصف ${room.name} في المعلم الذكي:`} />
      </section>

      <section className="flex flex-col gap-4 dashed-rule pt-7">
        <h2 className="font-display text-[22px] font-bold m-0">أرسل درسًا بعد الحصة</h2>
        <div className="flex gap-2 flex-wrap">
          {LESSON_LIST.map((l) => (
            <SketchChip key={l.id} selected={lessonId === l.id} onClick={() => setLessonId(l.id)} className="px-3.5 text-[14px]">
              {l.title.replace(/^درس /, "")}
            </SketchChip>
          ))}
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <input
            id="assign-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة للطلاب (اختياري): مثل، بعد حصة اليوم"
            aria-label="ملاحظة"
            className="min-w-0 flex-1 max-w-[480px] px-4 py-3 r-input ink-2 bg-surface text-[15px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
          />
          <SketchButton size="sm" onClick={send} disabled={busy} data-testid="assign">
            {busy ? "ينشئ…" : "أنشئ رابط الدرس"}
          </SketchButton>
        </div>

        {room.assignments.length === 0 && <div className="text-[14px] text-muted">ما أرسلت درسًا بعد.</div>}
        {room.assignments.map((a) => {
          const open = openId === a.id;
          const rows = room.students.map((s) => {
            const rs = (byStudentLesson.get(s.id + ":" + a.lessonId) ?? []).filter((r) => r.createdAt >= a.createdAt);
            const last = rs.sort((x, y) => y.createdAt - x.createdAt)[0];
            return { s, last, tries: rs.length };
          });
          const done = rows.filter((r) => r.last).length;
          const avg = done ? Math.round((rows.filter((r) => r.last).reduce((acc, r) => acc + (r.last!.questions ? r.last!.correct / r.last!.questions : 0), 0) / done) * 100) : 0;
          return (
            <div key={a.id} className="flex flex-col gap-3 px-5 py-4 r-card-2 ink bg-surface" data-testid="assignment">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-display text-[20px] font-bold">{lessonTitle(a.lessonId)}</div>
                  <div className="text-[13px] text-muted">
                    {a.note ? a.note + " · " : ""}أُرسل {relativeDay(a.createdAt)} · رمز <b className="tracking-[0.15em]" dir="ltr">{a.code}</b>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold">
                    أكمله {done} من {room.students.length}
                    {done ? ` · متوسط ${avg}%` : ""}
                  </span>
                  <SketchPill onClick={() => setOpenId(open ? null : a.id)}>{open ? "إخفاء الرابط" : "الرابط"}</SketchPill>
                </div>
              </div>
              {open && <ShareLink url={joinUrl(origin, a.code)} code={a.code} message={`${room.teacherName}: افتحوا ${lessonTitle(a.lessonId)} مع الأستاذ نواف:`} compact />}
              {room.students.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px] border-collapse min-w-[520px]">
                    <thead>
                      <tr className="text-muted text-[12px]">
                        <th className="text-right font-semibold py-1.5">الطالب</th>
                        <th className="text-right font-semibold py-1.5">الحالة</th>
                        <th className="text-right font-semibold py-1.5">الإجابات</th>
                        <th className="text-right font-semibold py-1.5">المستوى</th>
                        <th className="text-right font-semibold py-1.5">التقييم</th>
                        <th className="text-right font-semibold py-1.5">متى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ s, last, tries }) => (
                        <tr key={s.id} className="border-t border-rule">
                          <td className="py-2 font-semibold">{s.name}</td>
                          <td className={"py-2 " + (last ? "text-success" : "text-muted")}>{last ? (tries > 1 ? `أكمل (${tries} مرات)` : "أكمل") : "لم يبدأ"}</td>
                          <td className="py-2 tabular-nums">{last ? `${last.correct}/${last.questions}` : "—"}</td>
                          <td className="py-2">{last ? `${levelName(last.startDifficulty)} ← ${levelName(last.endDifficulty)}` : "—"}</td>
                          <td className="py-2">{last ? last.rating + (last.reexplain ? ` · أعاد الشرح ${last.reexplain}` : "") : "—"}</td>
                          <td className="py-2 text-muted">{last ? relativeDay(last.endedAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3 dashed-rule pt-7">
        <h2 className="font-display text-[22px] font-bold m-0">الطلاب ({room.students.length})</h2>
        {room.students.length === 0 && <div className="text-[14px] text-muted">ما انضم أحد بعد. شارك رمز الصف أو رابط درس.</div>}
        <div className="flex flex-col gap-2 text-[14px]">
          {room.students.map((s) => {
            const all = (room.results ?? []).filter((r) => r.studentId === s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold">{s.name}</span>
                <span className="text-muted">
                  {all.length} درس · انضم {relativeDay(s.createdAt)} · آخر نشاط {relativeDay(s.lastSeenAt)}
                </span>
                <SketchPill onClick={() => removeStudent({ token, studentId: s.id })} className="text-error">
                  إزالة
                </SketchPill>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
