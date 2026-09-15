import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// DB half of the email-code (OTP) sign-in; the "use node" actions in
// convex/authEmail.ts orchestrate these. Same parameters as careers.sa:
// sha256-hashed codes at rest, 10-minute expiry, single-use, only the latest
// code valid, 60s resend cooldown, ≤3 sends / 10 min per email, ≤8 attempts.

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_ATTEMPTS = 8;
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Read-only rate-limit gate, checked before the SMTP send so a failed send consumes nothing. */
export const sendGate = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; reason?: "cooldown" | "too_many" }> => {
    const now = Date.now();
    const existing = await ctx.db.query("authCodes").withIndex("by_email", (q) => q.eq("email", args.email)).collect();
    const latest = existing.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latest && now - latest.createdAt < RESEND_COOLDOWN_MS) return { ok: false, reason: "cooldown" };
    const windowStart = latest?.firstSentAt ?? now;
    const inWindow = latest && now - windowStart < SEND_WINDOW_MS;
    const sendCount = inWindow ? (latest.sendCount ?? 1) : 0;
    if (inWindow && sendCount >= MAX_SENDS_PER_WINDOW) return { ok: false, reason: "too_many" };
    return { ok: true };
  },
});

export const replaceCode = internalMutation({
  args: { email: v.string(), codeHash: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; reason?: "cooldown" | "too_many" }> => {
    const now = Date.now();
    const existing = await ctx.db.query("authCodes").withIndex("by_email", (q) => q.eq("email", args.email)).collect();
    const latest = existing.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latest && now - latest.createdAt < RESEND_COOLDOWN_MS) return { ok: false, reason: "cooldown" };
    const windowStart = latest?.firstSentAt ?? now;
    const inWindow = latest && now - windowStart < SEND_WINDOW_MS;
    const sendCount = inWindow ? (latest.sendCount ?? 1) : 0;
    if (inWindow && sendCount >= MAX_SENDS_PER_WINDOW) return { ok: false, reason: "too_many" };
    for (const row of existing) await ctx.db.delete(row._id);
    await ctx.db.insert("authCodes", {
      email: args.email,
      code: args.codeHash,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      sendCount: sendCount + 1,
      firstSentAt: inWindow ? windowStart : now,
      createdAt: now,
    });
    return { ok: true };
  },
});

/** Verify a code; on success open (or reuse) the household and hand out a session token. */
export const consumeAndOpen = internalMutation({
  args: { email: v.string(), codeHash: v.string() },
  handler: async (ctx, args): Promise<{ token: string; expiresAt: number }> => {
    const row = await ctx.db.query("authCodes").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (!row || row.expiresAt < Date.now()) {
      if (row) await ctx.db.delete(row._id);
      throw new Error("code expired");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await ctx.db.delete(row._id);
      throw new Error("too many attempts");
    }
    if (row.code !== args.codeHash) {
      await ctx.db.patch(row._id, { attempts: row.attempts + 1 });
      throw new Error("wrong code");
    }
    await ctx.db.delete(row._id); // single-use

    const now = Date.now();
    let household = await ctx.db.query("households").withIndex("by_email", (q) => q.eq("email", args.email)).unique();
    const householdId = household ? household._id : await ctx.db.insert("households", { email: args.email, createdAt: now, digestOptIn: true });
    household = household ?? (await ctx.db.get(householdId))!;

    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = now + SESSION_TTL_MS;
    await ctx.db.insert("householdSessions", { householdId: household._id, token, expiresAt, createdAt: now });
    // Opportunistic cleanup of this household's expired sessions.
    const sessions = await ctx.db.query("householdSessions").withIndex("by_household", (q) => q.eq("householdId", household!._id)).collect();
    for (const s of sessions) if (s.expiresAt < now) await ctx.db.delete(s._id);
    return { token, expiresAt };
  },
});
