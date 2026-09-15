"use client";

import { useState } from "react";
import { SketchButton, SketchPill } from "@/components/Sketch";
import { useAccount } from "@/lib/convex/account";

const input = "min-w-0 px-4 py-3 r-input ink-2 bg-surface text-[17px] outline-none placeholder:text-faint focus:shadow-[4px_4px_0_var(--color-primary-tint)]";

/** Email → six-digit code sign-in. Used by the parent area and the admin page. */
export default function EmailCodeForm({ intro, onSignedIn }: { intro?: string; onSignedIn?: () => void }) {
  const acct = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "ok" } | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

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
      setMsg(null);
      onSignedIn?.();
    } else setMsg({ text: res.error ?? "الرمز غير صحيح.", tone: "error" });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[460px]">
      {intro && <div className="text-[14px] text-ink-2 leading-[1.7]">{intro}</div>}
      {stage === "email" ? (
        <form
          className="flex gap-2.5 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) send();
          }}
        >
          <input id="account-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={input + " flex-1 text-left"} aria-label="البريد الإلكتروني" />
          <SketchButton type="submit" size="xs" disabled={acct.busy === "sending" || !email.includes("@")}>
            {acct.busy === "sending" ? "يرسل…" : "أرسل الرمز"}
          </SketchButton>
        </form>
      ) : (
        <form
          className="flex gap-2.5 flex-wrap items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) verify();
          }}
        >
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
          <SketchButton type="submit" size="xs" disabled={acct.busy === "verifying" || code.length !== 6}>
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
        </form>
      )}
      {msg && <div className={"text-[14px] " + (msg.tone === "error" ? "text-error" : "text-success")}>{msg.text}</div>}
    </div>
  );
}
