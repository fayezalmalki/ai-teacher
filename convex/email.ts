"use node";

// Outbound email over SMTP (ImprovMX, the same env names as careers.sa and
// profile.sa so one credential set serves every product):
//   npx convex env set SMTP_HOST smtp.improvmx.com
//   npx convex env set SMTP_PORT 587
//   npx convex env set SMTP_USER hello@school.mvp.sa
//   npx convex env set SMTP_PASSWORD …
//   npx convex env set SMTP_FROM "المعلم الذكي <hello@school.mvp.sa>"
// Import only from "use node" action files.

import nodemailer from "nodemailer";

const env = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
};

export const DEFAULT_FROM = "المعلم الذكي <hello@school.mvp.sa>";
export const APP_URL = env("APP_URL") ?? "https://school.mvp.sa";

export function isEmailConfigured(): boolean {
  return Boolean(env("SMTP_PASSWORD"));
}

export type SmtpErrorClass = "auth" | "from_rejected" | "timeout" | "not_configured" | "other";

export function classifySmtpError(error: unknown): SmtpErrorClass {
  const err = error as { code?: string; responseCode?: number; message?: string } | undefined;
  if (!err) return "other";
  if (err.responseCode === 535 || err.code === "EAUTH") return "auth";
  if (err.responseCode === 550 || err.responseCode === 553) return "from_rejected";
  if (err.code === "ETIMEDOUT" || err.code === "ECONNECTION" || err.code === "ESOCKET") return "timeout";
  return "other";
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** Cream page, ink text, blue accent: the app's own palette in email-safe inline styles. */
export function shell(title: string, body: string, footerNote: string): string {
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#FBF8F1;font-family:'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;color:#23272A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF8F1;padding:28px 12px;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#FFFFFF;border:3px solid #23272A;border-radius:22px;">
      <tr><td style="padding:28px 28px 8px;text-align:right;">
        <div style="font-size:14px;font-weight:700;color:#2F6BD8;">المعلم الذكي</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.35;font-weight:700;color:#23272A;">${escapeHtml(title)}</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 24px;text-align:right;font-size:15px;line-height:1.8;color:#23272A;">${body}</td></tr>
      <tr><td style="padding:14px 28px 22px;border-top:2px dashed #C9CDC8;font-size:12px;line-height:1.7;color:#8A8F8B;text-align:right;">${footerNote}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function transport() {
  const pass = env("SMTP_PASSWORD");
  if (!pass) throw new Error("SMTP not configured");
  return nodemailer.createTransport({
    host: env("SMTP_HOST") ?? "smtp.improvmx.com",
    port: Number(env("SMTP_PORT") ?? 587),
    secure: false,
    auth: { user: env("SMTP_USER") ?? "", pass },
    connectionTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

export async function sendEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void> {
  const t = await transport();
  await t.sendMail({
    from: env("SMTP_FROM") ?? DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const body = `
    <p style="margin:0 0 18px;">استخدم هذا الرمز للدخول إلى منطقة ولي الأمر. الرمز صالح لمدة ١٠ دقائق فقط.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E7EFFC;border:2px solid #23272A;border-radius:16px;">
      <tr><td align="center" style="padding:22px 16px 18px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:#2F6BD8;margin-bottom:8px;">رمز الدخول</div>
        <div dir="ltr" style="font-family:Consolas,'Courier New',monospace;font-size:38px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#23272A;">${escapeHtml(code)}</div>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:13px;color:#5C6360;">لا تشارك هذا الرمز مع أحد. إذا لم تطلبه فتجاهل هذه الرسالة.</p>`;
  await sendEmail({
    to: email,
    subject: `رمز الدخول: ${code}`,
    html: shell("رمز الدخول إلى المعلم الذكي", body, "وصلتك هذه الرسالة لأن أحدهم أدخل بريدك في المعلم الذكي."),
    text: `رمز الدخول: ${code} (صالح ١٠ دقائق)`,
  });
}
