"use client";

/**
 * /j/<code>: where a shared link lands. A child code binds this device to
 * that child of a parent's account; a class or assignment code joins the
 * teacher's class under a name the student types, then opens the lesson.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Frame from "@/components/Frame";
import AppHeader from "@/components/AppHeader";
import Teacher from "@/components/Teacher";
import { SketchButton } from "@/components/Sketch";
import { gradeLabel } from "@/lib/content/catalog";
import { convexEnabled } from "@/lib/convex/config";
import { useLinks } from "@/lib/convex/links";
import { normalizeCode } from "@/lib/links/code";
import { lessonTitle } from "@/lib/lessons";
import { deviceLabel } from "@/lib/store/links";
import { DEMO_CHILD } from "@/lib/store/state";
import { useAppStore } from "@/lib/store/app-store";

const DEVICE_KEY = "ai-teacher:device";

function deviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = "d_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "d_anon" + Math.random().toString(36).slice(2, 10);
  }
}

export default function JoinPage() {
  const { code: raw } = useParams<{ code: string }>();
  const code = normalizeCode(raw ?? "");
  if (!convexEnabled()) {
    return (
      <Shell>
        <p className="text-[17px] text-ink-2 m-0">الروابط غير مفعّلة على هذا النشر.</p>
      </Shell>
    );
  }
  return <Join code={code} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Frame>
      <AppHeader backHref="/" showSubjects={false} />
      <div className="flex-1 grid place-items-center px-6 sm:px-8 pt-10 pb-20">
        <div className="flex flex-col items-center gap-6 text-center max-w-[520px] w-full">
          <Teacher size={120} idleWobble />
          {children}
        </div>
      </div>
    </Frame>
  );
}

function Join({ code }: { code: string }) {
  const router = useRouter();
  const info = useQuery(api.links.resolve, { code });
  const redeem = useMutation(api.links.redeem);
  const { attachChild, joinClass, links } = useLinks();
  const { state, child, addChild, updateChild, setActiveChild, setOnboarded } = useAppStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const already = info?.kind === "class" || info?.kind === "assignment" ? links.classes.find((c) => c.classroomName === info.classroomName) : undefined;

  useEffect(() => {
    if (state.onboarded && child.name !== DEMO_CHILD.name) setName(child.name);
    else if (already) setName(already.studentName);
  }, [state.onboarded, child.name, already]);

  if (info === undefined) {
    return (
      <Shell>
        <p className="text-[16px] text-muted m-0">يتحقق من الرابط…</p>
      </Shell>
    );
  }
  if (info === null || info.kind === "expired") {
    return (
      <Shell>
        <h1 className="font-display text-[30px] font-bold m-0">{info === null ? "الرابط غير صحيح" : "انتهت صلاحية الرابط"}</h1>
        <p className="text-[16px] text-ink-2 m-0">{info === null ? "تأكد من الرابط أو اطلب رابطًا جديدًا ممن أرسله لك." : "اطلب من ولي الأمر رابطًا جديدًا من صفحته."}</p>
        <SketchButton href="/" variant="white" size="sm">
          الرئيسية
        </SketchButton>
      </Shell>
    );
  }

  const label = deviceLabel(navigator.userAgent);

  if (info.kind === "child") {
    const attach = async () => {
      setBusy(true);
      setError(null);
      try {
        const r = await redeem({ code, deviceId: deviceId(), label });
        if (r.kind !== "child") throw new Error("bad");
        attachChild(r);
        router.replace("/home");
      } catch {
        setError("تعذّر ربط الجهاز. جرّب مرة ثانية.");
        setBusy(false);
      }
    };
    return (
      <Shell>
        <div className="text-[14px] text-muted">رابط من ولي الأمر</div>
        <h1 className="font-display text-[34px] font-bold m-0 leading-tight">هلا {info.childName}!</h1>
        <p className="text-[17px] leading-[1.7] text-ink-2 m-0">
          هذا الجهاز بيصير جهازك: دروسك ومستواك تنحفظ هنا وتوصل لولي أمرك. {gradeLabel(info.grade)}.
        </p>
        <SketchButton size="lg" onClick={attach} disabled={busy} data-testid="attach">
          {busy ? "يربط…" : `نعم، أنا ${info.childName}`}
        </SketchButton>
        {error && <div className="text-[14px] text-error">{error}</div>}
      </Shell>
    );
  }

  // class or assignment
  const join = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setError(null);
    try {
      // The student's sessions come from a local child; reuse the onboarded one, else create one for this class.
      let clientChildId = child.id;
      if (!state.onboarded || child.name === DEMO_CHILD.name) {
        if (child.name === DEMO_CHILD.name && child.results.length === 0 && state.children.length === 1) {
          // Fresh device: the demo child becomes this student.
          updateChild(child.id, { name: n, age: info.grade + 5, grade: info.grade });
        } else clientChildId = addChild({ name: n, age: info.grade + 5, grade: info.grade });
        setActiveChild(clientChildId);
        setOnboarded(true);
      }
      const r = await redeem({ code, deviceId: deviceId(), name: n, label, clientChildId });
      if (r.kind !== "class") throw new Error("bad");
      joinClass(r, clientChildId);
      router.replace(r.lessonId ? `/lesson/${r.lessonId}` : "/home");
    } catch {
      setError("تعذّر الانضمام. جرّب مرة ثانية.");
      setBusy(false);
    }
  };
  return (
    <Shell>
      <div className="text-[14px] text-muted">
        {info.teacherName} · {info.classroomName} · {gradeLabel(info.grade)}
      </div>
      <h1 className="font-display text-[32px] font-bold m-0 leading-tight">{info.kind === "assignment" ? lessonTitle(info.lessonId) : "انضم إلى الصف"}</h1>
      {info.kind === "assignment" && info.note && <p className="text-[16px] text-ink-2 m-0">{info.note}</p>}
      <p className="text-[16px] leading-[1.7] text-ink-2 m-0">{info.kind === "assignment" ? "اكتب اسمك عشان يعرف معلمك إنك خلصت الدرس." : "اكتب اسمك عشان يشوف معلمك تقدمك."}</p>
      <form
        className="flex gap-2.5 flex-wrap justify-center w-full"
        onSubmit={(e) => {
          e.preventDefault();
          join();
        }}
      >
        <input
          id="join-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
          aria-label="اسم الطالب"
          className="min-w-0 w-[240px] px-5 py-3.5 r-input ink bg-surface font-display font-semibold text-[20px] text-center outline-none placeholder:text-faint placeholder:font-normal focus:shadow-[4px_4px_0_var(--color-primary-tint)]"
        />
        <SketchButton type="submit" size="lg" disabled={busy || !name.trim()} data-testid="join">
          {busy ? "ينضم…" : info.kind === "assignment" ? "ابدأ الدرس" : "انضم"}
        </SketchButton>
      </form>
      {error && <div className="text-[14px] text-error">{error}</div>}
    </Shell>
  );
}
