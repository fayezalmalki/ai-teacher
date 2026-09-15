"use node";

// Weekly parent summary: one email per household that opted in and had at
// least one session this week. Same numbers as the parent area, computed by
// lib/store/insights.ts over the synced results. Runs from crons.ts.

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { SessionResult } from "../lib/lesson-engine/types";
import { lessonTitle } from "../lib/lessons";
import { bestImprovement, sessionRows, weekStats } from "../lib/store/insights";
import { APP_URL, escapeHtml, isEmailConfigured, sendEmail, shell } from "./email";

function childBlock(name: string, results: SessionResult[]): string {
  const week = weekStats(results);
  if (!week.sessions) return "";
  const rows = sessionRows(results, lessonTitle).filter((r) => (r.result.endedAt ?? r.result.startedAt ?? 0) >= Date.now() - 7 * 24 * 60 * 60 * 1000);
  const improvement = bestImprovement(results, lessonTitle);
  const list = rows
    .slice(0, 5)
    .map((r) => `<li style="margin:0 0 6px;"><b>${escapeHtml(r.title)}</b> <span style="color:#8A8F8B;font-size:13px;">· ${escapeHtml(r.meta)}</span> <span style="color:${r.tone === "green" ? "#1F8A5B" : "#8A6A1F"};font-size:13px;font-weight:700;">${escapeHtml(r.rating)}</span></li>`)
    .join("");
  const latestLog = rows[0]?.result.log?.slice(-2).join(" ") ?? "";
  return `
    <h2 style="margin:22px 0 8px;font-size:19px;font-weight:700;">${escapeHtml(name)}</h2>
    <p style="margin:0 0 10px;">${week.sessions === 1 ? "جلسة واحدة" : week.sessions === 2 ? "جلستان" : `${week.sessions} جلسات`} · ${week.minutes} دقيقة تعلّم · ${week.correct} من ${week.questions} إجابات صحيحة${improvement ? ` · أبرز تحسّن: ${escapeHtml(improvement.replace(/^درس /, ""))}` : ""}</p>
    <ul style="margin:0;padding:0 18px 0 0;">${list}</ul>
    ${latestLog ? `<p style="margin:12px 0 0;padding:12px 16px;border:2px dashed #C9CDC8;border-radius:14px;color:#5C6360;font-size:14px;">${escapeHtml(latestLog)}</p>` : ""}`;
}

export const weekly = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!isEmailConfigured()) {
      console.warn("[digest] SMTP not configured; skipping weekly digest");
      return { sent: 0, skipped: "not_configured" };
    }
    const targets = await ctx.runQuery(internal.household.digestTargets, {});
    let sent = 0;
    for (const t of targets) {
      const blocks = t.children
        .map((c) => childBlock(c.name, t.results.filter((r) => r.childClientId === c.clientId) as unknown as SessionResult[]))
        .filter(Boolean)
        .join("");
      if (!blocks) continue;
      const body = `<p style="margin:0;">هذا ملخص أسبوع أطفالك مع الأستاذ نواف.</p>${blocks}
        <p style="margin:22px 0 0;"><a href="${APP_URL}/parent/pin" style="display:inline-block;padding:12px 22px;border:3px solid #23272A;border-radius:18px;background:#2F6BD8;color:#fff;font-weight:700;text-decoration:none;">افتح منطقة ولي الأمر</a></p>`;
      try {
        await sendEmail({
          to: t.email,
          subject: "ملخص الأسبوع من الأستاذ نواف",
          html: shell("ملخص الأسبوع", body, `تصلك هذه الرسالة كل أسبوع لأنك فعّلت الملخص الأسبوعي في منطقة ولي الأمر على ${APP_URL}. يمكنك إيقافه من هناك.`),
        });
        await ctx.runMutation(internal.digestDb.markSent, { householdId: t.householdId });
        sent++;
      } catch (error) {
        console.error(`[digest] send failed for household ${t.householdId}`, error);
      }
    }
    return { sent };
  },
});
