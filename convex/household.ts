import { v } from "convex/values";
import { internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * The household API. Every public function takes the session token from
 * verifyCode; an unknown or expired token reads as `null` from `me` (so the
 * device signs itself out) and throws from mutations.
 */

const childInput = v.object({
  clientId: v.string(),
  name: v.string(),
  age: v.number(),
  grade: v.number(),
  color: v.string(),
  settings: v.any(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const resultInput = v.object({
  childClientId: v.string(),
  lessonId: v.string(),
  startedAt: v.union(v.number(), v.null()),
  endedAt: v.union(v.number(), v.null()),
  questions: v.number(),
  correct: v.number(),
  reexplain: v.number(),
  startDifficulty: v.number(),
  endDifficulty: v.number(),
  rating: v.string(),
  log: v.array(v.string()),
  visited: v.array(v.string()),
  askTurns: v.any(),
  concepts: v.optional(v.any()),
});

export function resultKey(lessonId: string, startedAt: number | null, endedAt: number | null): string {
  return `${lessonId}:${startedAt ?? endedAt ?? 0}`;
}

async function sessionByToken(ctx: QueryCtx | MutationCtx, token: string) {
  if (!token) return null;
  const s = await ctx.db.query("householdSessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
  if (!s || s.expiresAt < Date.now()) return null;
  return s;
}

async function requireHousehold(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"households">> {
  const s = await sessionByToken(ctx, token);
  const h = s ? await ctx.db.get(s.householdId) : null;
  if (!h) throw new Error("not signed in");
  return h;
}

function publicChild(c: Doc<"children">) {
  return { clientId: c.clientId, name: c.name, age: c.age, grade: c.grade, color: c.color, settings: c.settings, createdAt: c.createdAt, updatedAt: c.updatedAt };
}

function publicResult(r: Doc<"results">) {
  const { _id, _creationTime, householdId, key, createdAt, ...rest } = r;
  void _id;
  void _creationTime;
  void householdId;
  void key;
  void createdAt;
  return rest;
}

async function snapshot(ctx: QueryCtx | MutationCtx, householdId: Id<"households">) {
  const children = await ctx.db.query("children").withIndex("by_household", (q) => q.eq("householdId", householdId)).collect();
  const results = await ctx.db.query("results").withIndex("by_household", (q) => q.eq("householdId", householdId)).collect();
  return { children: children.map(publicChild), results: results.map(publicResult) };
}

/** The signed-in household with its children and finished sessions; null when the token is invalid. */
export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const s = await sessionByToken(ctx, args.token);
    const h = s ? await ctx.db.get(s.householdId) : null;
    if (!h) return null;
    const snap = await snapshot(ctx, h._id);
    return { email: h.email, digestOptIn: h.digestOptIn, lastSyncAt: h.lastSyncAt ?? null, ...snap };
  },
});

/**
 * Push the device's household. Children upsert by clientId (the newer
 * updatedAt wins); results insert once per lesson start. Returns the merged
 * household so the device can reconcile in one round trip.
 */
export const sync = mutation({
  args: { token: v.string(), children: v.array(childInput), results: v.array(resultInput) },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const now = Date.now();
    for (const c of args.children) {
      const existing = await ctx.db
        .query("children")
        .withIndex("by_household_client", (q) => q.eq("householdId", h._id).eq("clientId", c.clientId))
        .unique();
      const updatedAt = c.updatedAt ?? c.createdAt;
      if (!existing) {
        await ctx.db.insert("children", { householdId: h._id, ...c, updatedAt });
      } else if (updatedAt >= existing.updatedAt) {
        await ctx.db.patch(existing._id, { name: c.name, age: c.age, grade: c.grade, color: c.color, settings: c.settings, updatedAt });
      }
    }
    for (const r of args.results) {
      const key = resultKey(r.lessonId, r.startedAt, r.endedAt);
      const existing = await ctx.db
        .query("results")
        .withIndex("by_household_key", (q) => q.eq("householdId", h._id).eq("key", key))
        .first();
      if (!existing) await ctx.db.insert("results", { householdId: h._id, key, createdAt: now, ...r });
    }
    await ctx.db.patch(h._id, { lastSyncAt: now });
    return { lastSyncAt: now, ...(await snapshot(ctx, h._id)) };
  },
});

export const removeChild = mutation({
  args: { token: v.string(), clientId: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const child = await ctx.db
      .query("children")
      .withIndex("by_household_client", (q) => q.eq("householdId", h._id).eq("clientId", args.clientId))
      .unique();
    if (child) await ctx.db.delete(child._id);
    const results = await ctx.db
      .query("results")
      .withIndex("by_household_child", (q) => q.eq("householdId", h._id).eq("childClientId", args.clientId))
      .collect();
    for (const r of results) await ctx.db.delete(r._id);
    return { removed: !!child, results: results.length };
  },
});

export const setDigest = mutation({
  args: { token: v.string(), optIn: v.boolean() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    await ctx.db.patch(h._id, { digestOptIn: args.optIn });
    return { optIn: args.optIn };
  },
});

/** Everything the household owns, for the parent's data export. */
export const exportData = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const snap = await snapshot(ctx, h._id);
    return { exportedAt: Date.now(), email: h.email, createdAt: h.createdAt, digestOptIn: h.digestOptIn, ...snap };
  },
});

/** Delete the household and everything under it. The device keeps its local copy unless it clears it. */
export const deleteAccount = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    for (const table of ["results", "children", "householdSessions"] as const) {
      const rows = await ctx.db.query(table).withIndex("by_household", (q) => q.eq("householdId", h._id)).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    const codes = await ctx.db.query("authCodes").withIndex("by_email", (q) => q.eq("email", h.email)).collect();
    for (const c of codes) await ctx.db.delete(c._id);
    await ctx.db.delete(h._id);
    return { deleted: true };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const s = await sessionByToken(ctx, args.token);
    if (s) await ctx.db.delete(s._id);
    return { ok: true };
  },
});

/** Households due a weekly summary: opted in, with at least one session in the last 7 days. */
export const digestTargets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const households = await ctx.db.query("households").collect();
    const out: { householdId: Id<"households">; email: string; children: ReturnType<typeof publicChild>[]; results: ReturnType<typeof publicResult>[] }[] = [];
    for (const h of households) {
      if (!h.digestOptIn) continue;
      const snap = await snapshot(ctx, h._id);
      const recent = snap.results.filter((r) => (r.endedAt ?? r.startedAt ?? 0) >= since);
      if (!recent.length) continue;
      out.push({ householdId: h._id, email: h.email, children: snap.children, results: snap.results });
    }
    return out;
  },
});
