"use client";

import { useState } from "react";
import { SketchButton, SketchPill } from "@/components/Sketch";
import { useAccount } from "@/lib/convex/account";
import { relativeDay } from "@/lib/store/insights";

/**
 * Parent account: email-code sign-in, the sync state, the weekly digest
 * toggle, data export and account deletion. Hidden entirely when the
 * deployment has no Convex URL.
 */
export default function AccountSection() {
  const acct = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  if (!acct.enabled) return null;

  const input = "min-w-0 px-4 py-3 r-input ink-2 bg-surface text-[17px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]";

  const send = async () => {
    setMsg(null);
    const res = await acct.requestCode(email);
    if (res.devCode) setDevCode(res.devCode);
    if (res.sent || res.devCode) {
      setStage("code");
      setMsg({ text: res.sent ? "أرسلنا رمزًا إلى بريدك. صالح لمدة ١٠ دقائق." : "وضع التجربة: الرمز معروض تحت.", tone: "ok" });
    } else setMsg({ text: res.error ?? "تعذّر الإرسال.", tone: "error" });
  };

  const verify = async () => {
    setMsg(null);
    const res = await acct.verifyCode(email, code);
    if (res.ok) {
      setCode("");
      setDevCode(null);
      setStage("email");
      setMsg({ text: "تم الدخول. الآن تتم مزامنة الأطفال وجلساتهم مع حسابك.", tone: "ok" });
    } else setMsg({ text: res.error ?? "الرمز غير صحيح.", tone: "error" });
  };

  const download = async () => {
    const data = await acct.exportData();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `almuallim-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={!!acct.remote?.digestOptIn}
      onClick={() => acct.setDigest(!acct.remote?.digestOptIn)}
      className="flex items-center gap-2.5 p-0 border-0 bg-transparent self-start"
    >
      <span className="relative inline-block w-[46px] h-[26px] rounded-[13px] ink-2 transition-colors duration-200 flex-none" style={{ background: acct.remote?.digestOptIn ? "var(--color-primary)" : "var(--color-surface)" }}>
        <span className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-surface ink-2 transition-[left] duration-200" style={{ left: acct.remote?.digestOptIn ? 22 : 2 }} />
      </span>
      <span className="text-[14px] text-ink-2">ملخص أسبوعي بالبريد (الأحد صباحًا)</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4 dashed-rule pt-7">
      <div className="text-[15px] font-semibold">حساب ولي الأمر</div>
      {!acct.account ? (
        <div className="flex flex-col gap-3 max-w-[460px]">
          <div className="text-[14px] text-ink-2 leading-[1.7]">سجّل ببريدك ليبقى الأطفال وجلساتهم محفوظين على أكثر من جهاز، ويوصلك ملخص أسبوعي.</div>
          {stage === "email" ? (
            <div className="flex gap-2.5 flex-wrap">
              <input id="account-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={input + " flex-1 text-left"} aria-label="البريد الإلكتروني" />
              <SketchButton size="xs" onClick={send} disabled={acct.busy === "sending" || !email.includes("@")}>
                {acct.busy === "sending" ? "يرسل…" : "أرسل الرمز"}
              </SketchButton>
            </div>
          ) : (
            <div className="flex gap-2.5 flex-wrap items-center">
              <input
                id="account-code"
                inputMode="numeric"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className={input + " w-[150px] flex-none text-center font-display text-[22px] tracking-[6px]"}
                aria-label="رمز الدخول"
              />
              <SketchButton size="xs" onClick={verify} disabled={acct.busy === "verifying" || code.length !== 6}>
                {acct.busy === "verifying" ? "يتحقق…" : "تأكيد"}
              </SketchButton>
              <SketchPill
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setDevCode(null);
                  setMsg(null);
                }}
              >
                غيّر البريد
              </SketchPill>
              {devCode && (
                <span className="text-[13px] text-muted font-mono" dir="ltr" data-testid="dev-code">
                  DEMO_AUTH code: {devCode}
                </span>
              )}
            </div>
          )}
          {msg && <div className={"text-[14px] " + (msg.tone === "error" ? "text-error" : "text-success")}>{msg.text}</div>}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3 flex-wrap text-[15px]">
            <span className="font-semibold" dir="ltr">
              {acct.account.email}
            </span>
            <span className="text-[13px] text-muted">
              {acct.busy === "syncing" ? "يزامن…" : acct.lastSyncAt ? `آخر مزامنة ${relativeDay(acct.lastSyncAt)}` : "لم تتم المزامنة بعد"}
            </span>
          </div>
          {msg && <div className={"text-[14px] " + (msg.tone === "error" ? "text-error" : "text-success")}>{msg.text}</div>}
          {Toggle}
          <div className="flex gap-3 flex-wrap items-center">
            <SketchPill onClick={download}>تصدير البيانات</SketchPill>
            <SketchPill onClick={() => acct.signOut()}>تسجيل الخروج</SketchPill>
            {!confirmDelete ? (
              <SketchPill onClick={() => setConfirmDelete(true)} className="text-error">
                حذف الحساب
              </SketchPill>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap text-[14px] text-ink-2">
                <span>يُحذف الحساب وكل ما فيه من الخادم. تبقى نسخة هذا الجهاز.</span>
                <SketchButton size="xs" variant="white" onClick={() => setConfirmDelete(false)}>
                  تراجع
                </SketchButton>
                <SketchButton
                  size="xs"
                  className="!bg-error"
                  onClick={async () => {
                    await acct.deleteAccount();
                    setConfirmDelete(false);
                    setMsg({ text: "حُذف الحساب من الخادم.", tone: "ok" });
                  }}
                >
                  نعم، احذف
                </SketchButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
