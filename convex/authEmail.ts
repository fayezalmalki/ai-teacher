"use node";

// Email-code (OTP) sign-in for the parent account, ported from careers.sa:
// 6-digit randomInt code, sha256-hashed at rest, 10-minute expiry, single-use,
// latest-code-only, 60s resend cooldown, ≤3 sends / 10 min, ≤8 attempts.
//
// Invariants: the code never leaves the server except inside the email (the
// explicit dev opt-in `DEMO_AUTH=1` Convex env var is the only exception, and
// never a fallback for a failed send); rate-limit precheck → send → commit,
// so a failed send consumes no cooldown and stores no code.

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { createHash, randomInt } from "crypto";
import { classifySmtpError, isEmailConfigured, sendOtpEmail, type SmtpErrorClass } from "./email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateOTP(): string {
  return String(randomInt(100000, 1000000));
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

const FAILURE_MESSAGES: Record<SmtpErrorClass, string> = {
  auth: "تعذّر إرسال الرمز بسبب خلل في خادم البريد لدينا. حاول بعد قليل.",
  from_rejected: "تعذّر إرسال الرمز لأن خادم البريد رفض عنوان المرسل. حاول بعد قليل.",
  timeout: "خادم البريد بطيء حاليًا. أعد المحاولة خلال لحظات.",
  not_configured: "خدمة البريد غير متاحة حاليًا، فلا يمكننا إرسال رموز الدخول.",
  other: "تعذّر إرسال الرمز. أعد المحاولة بعد قليل.",
};

export const requestCode = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ sent: boolean; devCode?: string; error?: string }> => {
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) return { sent: false, error: "اكتب بريدًا صحيحًا." };

    const gate = await ctx.runQuery(internal.authEmailDb.sendGate, { email });
    if (!gate.ok) {
      return {
        sent: false,
        error: gate.reason === "cooldown" ? "أرسلنا لك رمزًا قبل قليل. انتظر دقيقة ثم أعد المحاولة." : "بلغت الحد المسموح. أعد المحاولة بعد ١٠ دقائق.",
      };
    }

    const code = generateOTP();

    if (process.env.DEMO_AUTH === "1") {
      const stored = await ctx.runMutation(internal.authEmailDb.replaceCode, { email, codeHash: hashCode(code) });
      if (!stored.ok) return { sent: false, error: FAILURE_MESSAGES.other };
      console.warn("[authEmail] DEMO_AUTH=1 — returning devCode (dev only)");
      return { sent: false, devCode: code };
    }

    if (!isEmailConfigured()) {
      console.error("[authEmail] SMTP not configured (SMTP_PASSWORD missing) — refusing to issue OTP");
      return { sent: false, error: FAILURE_MESSAGES.not_configured };
    }

    try {
      await sendOtpEmail(email, code);
    } catch (error) {
      const cls = classifySmtpError(error);
      console.error(`[authEmail] OTP send failed (${cls})`, error);
      return { sent: false, error: FAILURE_MESSAGES[cls] };
    }

    await ctx.runMutation(internal.authEmailDb.replaceCode, { email, codeHash: hashCode(code) });
    return { sent: true };
  },
});

export const verifyCode = action({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; token?: string; expiresAt?: number; email: string; error?: string }> => {
    const email = args.email.trim().toLowerCase();
    try {
      const session = await ctx.runMutation(internal.authEmailDb.consumeAndOpen, { email, codeHash: hashCode(args.code.trim()) });
      return { ok: true, email, ...session };
    } catch (error) {
      const msg = (error as Error).message ?? "";
      const friendly = msg.includes("expired")
        ? "انتهت صلاحية الرمز. اطلب رمزًا جديدًا."
        : msg.includes("too many")
          ? "محاولات كثيرة. اطلب رمزًا جديدًا."
          : "الرمز غير صحيح.";
      return { ok: false, email, error: friendly };
    }
  },
});
