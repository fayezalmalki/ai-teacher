import { v } from "convex/values";
import { query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { summarize } from "../lib/telemetry/aggregate";
import { gateConfig } from "./gate";

/** Comma-separated admin emails in the deployment env (ADMIN_EMAILS). */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function householdByToken(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"households"> | null> {
  const session = await ctx.db.query("householdSessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
  if (!session || session.expiresAt < Date.now()) return null;
  return ctx.db.get(session.householdId);
}

export async function adminOf(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"households"> | null> {
  const h = await householdByToken(ctx, token);
  return h && adminEmails().has(h.email.toLowerCase()) ? h : null;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"households">> {
  const h = await adminOf(ctx, token);
  if (!h) throw new Error("forbidden");
  return h;
}

/** Who the token belongs to and whether they may see the admin page. */
export const whoami = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const h = await householdByToken(ctx, token);
    if (!h) return null;
    return { email: h.email, admin: adminEmails().has(h.email.toLowerCase()), configured: adminEmails().size > 0 };
  },
});

/** Usage in the last N days, plus account totals and the gate state. Null unless admin. */
export const overview = query({
  args: { token: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { token, days }) => {
    if (!(await adminOf(ctx, token))) return null;
    const n = Math.max(1, Math.min(90, Math.round(days ?? 7)));
    const now = Date.now();
    const since = now - n * 86_400_000;
    const events = await ctx.db.query("events").withIndex("by_ts", (q) => q.gte("ts", since)).collect();
    const usage = summarize(events, now, n);
    const households = await ctx.db.query("households").collect();
    const results = await ctx.db.query("results").collect();
    const gate = await gateConfig(ctx);
    return {
      usage,
      accounts: {
        households: households.length,
        newHouseholds: households.filter((h) => h.createdAt >= since).length,
        results: results.length,
        newResults: results.filter((r) => r.createdAt >= since).length,
      },
      gate: { mode: gate.mode, code: gate.code, message: gate.message },
      generatedAt: now,
    };
  },
});

/** Signed-in parents, newest first, with what they synced. Null unless admin. */
export const households = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!(await adminOf(ctx, token))) return null;
    const all = await ctx.db.query("households").collect();
    all.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const h of all.slice(0, 50)) {
      const children = await ctx.db.query("children").withIndex("by_household", (q) => q.eq("householdId", h._id)).collect();
      const results = await ctx.db.query("results").withIndex("by_household", (q) => q.eq("householdId", h._id)).collect();
      out.push({
        email: h.email,
        createdAt: h.createdAt,
        lastSyncAt: h.lastSyncAt ?? null,
        digestOptIn: h.digestOptIn,
        children: children.map((c) => ({ name: c.name, grade: c.grade })),
        sessions: results.length,
      });
    }
    return out;
  },
});

/** The last finished sessions across all accounts. Null unless admin. */
export const recentSessions = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!(await adminOf(ctx, token))) return null;
    const results = await ctx.db.query("results").collect();
    results.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const r of results.slice(0, 40)) {
      const child = await ctx.db
        .query("children")
        .withIndex("by_household_client", (q) => q.eq("householdId", r.householdId).eq("clientId", r.childClientId))
        .unique();
      const h = await ctx.db.get(r.householdId);
      out.push({
        lessonId: r.lessonId,
        childName: child?.name ?? "؟",
        email: h?.email ?? "",
        questions: r.questions,
        correct: r.correct,
        rating: r.rating,
        endedAt: r.endedAt ?? r.createdAt,
      });
    }
    return out;
  },
});
