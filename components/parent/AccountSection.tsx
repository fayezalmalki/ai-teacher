"use client";

import { useState } from "react";
import { SketchButton, SketchPill } from "@/components/Sketch";
import { useAccount } from "@/lib/convex/account";
import EmailCodeForm from "./EmailCodeForm";
import { relativeDay } from "@/lib/store/insights";

/**
 * Parent account: email-code sign-in, the sync state, the weekly digest
 * toggle, data export and account deletion. Hidden entirely when the
 * deployment has no Convex URL.
 */
export default function AccountSection() {
  const acct = useAccount();
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!acct.enabled) return null;

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
        <EmailCodeForm
          intro="سجّل ببريدك ليبقى الأطفال وجلساتهم محفوظين على أكثر من جهاز، ويوصلك ملخص أسبوعي."
          onSignedIn={() => setMsg({ text: "تم الدخول. الآن تتم مزامنة الأطفال وجلساتهم مع حسابك.", tone: "ok" })}
        />
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
