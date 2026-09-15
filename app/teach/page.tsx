"use client";

/**
 * Teacher area: sign in with email, list your classes, create one. A class
 * has a permanent join code; a lesson link ("do this after today's class")
 * gets its own code. Results per student appear on the class page.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import EmailCodeForm from "@/components/parent/EmailCodeForm";
import { SketchButton, SketchChip, SketchPill, cardRadius } from "@/components/Sketch";
import { GRADES, gradeLabel } from "@/lib/content/catalog";
import { useAccount } from "@/lib/convex/account";
import { relativeDay } from "@/lib/store/insights";

export default function TeachPage() {
  const acct = useAccount();
  return (
    <Frame>
      <AppHeader backHref="/" showSubjects={false} />
      <div className="flex-1 flex flex-col gap-9 px-6 sm:px-10 pt-10 pb-16 max-w-[1040px] w-full mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2 max-w-[620px]">
            <div className="text-[13px] text-muted">للمعلمين والمدارس</div>
            <h1 className="font-display text-[40px] font-bold m-0 leading-tight">صفوفك مع الأستاذ نواف</h1>
            <p className="text-[16px] text-ink-2 m-0 leading-[1.7]">أنشئ صفًا، شارك رمزه مع الطلاب، وبعد أي حصة أرسل لهم رابط الدرس. تشوف هنا من أكمله، وكم أجاب صح، وأي مستوى وصل.</p>
          </div>
          {acct.account && (
            <div className="flex items-center gap-3 text-[14px] text-muted">
              <span dir="ltr">{acct.account.email}</span>
              <SketchPill onClick={() => acct.signOut()}>خروج</SketchPill>
            </div>
          )}
        </div>
        {!acct.enabled ? (
          <p className="text-[16px] text-ink-2 m-0">هذا النشر بدون حسابات، فلا صفوف هنا.</p>
        ) : !acct.account ? (
          <EmailCodeForm intro="سجّل ببريدك (بريد المدرسة أو بريدك الشخصي). لا يحتاج كلمة مرور: يوصلك رمز بالبريد." />
        ) : (
          <Classes token={acct.account.token} />
        )}
        <Footer variant="slim" className="mt-auto" />
      </div>
    </Frame>
  );
}

function Classes({ token }: { token: string }) {
  const router = useRouter();
  const rooms = useQuery(api.classroom.mine, { token });
  const create = useMutation(api.classroom.create);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [grade, setGrade] = useState(3);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const input = "min-w-0 px-4 py-3 r-input ink-2 bg-surface text-[17px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]";

  const submit = async () => {
    if (!name.trim() || !teacher.trim()) return;
    setBusy(true);
    try {
      const r = await create({ token, name, teacherName: teacher, grade });
      router.push(`/teach/${r.id}`);
    } finally {
      setBusy(false);
    }
  };

  const showForm = open || (rooms !== undefined && rooms.length === 0);
  return (
    <div className="flex flex-col gap-8">
      {rooms === undefined ? (
        <div className="text-[14px] text-muted">يحمّل…</div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {rooms.map((r, i) => (
            <Link key={r.id} href={`/teach/${r.id}`} className={`flex flex-col gap-2 p-5 ${cardRadius(i)} ink bg-surface shadow-tint-blue text-ink hover:text-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-sm`}>
              <div className="font-display text-[22px] font-bold leading-tight">{r.name}</div>
              <div className="text-[13px] text-muted">
                {gradeLabel(r.grade)} · {r.teacherName}
              </div>
              <div className="text-[14px] text-ink-2">
                {r.students} طالب · {r.assignments} درس مرسل · رمز <b className="font-display tracking-[0.15em]" dir="ltr">{r.code}</b>
              </div>
              <div className="text-[12px] text-muted">أُنشئ {relativeDay(r.createdAt)}</div>
            </Link>
          ))}
        </div>
      ) : null}
      {showForm ? (
        <form
          className="flex flex-col gap-4 px-5 py-5 r-card-1 ink bg-surface shadow-tint-yellow max-w-[560px]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="font-display text-[22px] font-bold">صف جديد</div>
          <input id="class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الصف، مثل: ثالث أ" aria-label="اسم الصف" className={input} />
          <input id="teacher-name" value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="اسمك كما يعرفه الطلاب، مثل: الأستاذ خالد" aria-label="اسم المعلم" className={input} />
          <div className="flex flex-col gap-2">
            <div className="text-[13px] text-muted">الصف الدراسي</div>
            <div className="flex gap-2 flex-wrap">
              {GRADES.map((g, i) => (
                <SketchChip key={g} selected={grade === i + 1} onClick={() => setGrade(i + 1)} className="px-3.5 text-[14px]">
                  {g}
                </SketchChip>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <SketchButton type="submit" size="sm" disabled={busy || !name.trim() || !teacher.trim()}>
              {busy ? "ينشئ…" : "أنشئ الصف"}
            </SketchButton>
            {rooms && rooms.length > 0 && (
              <SketchPill onClick={() => setOpen(false)}>إلغاء</SketchPill>
            )}
          </div>
        </form>
      ) : (
        <SketchButton size="sm" variant="white" onClick={() => setOpen(true)} className="self-start">
          صف جديد
        </SketchButton>
      )}
    </div>
  );
}
