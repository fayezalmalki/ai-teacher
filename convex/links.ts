import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { CHILD_CODE_LENGTH, isValidCode, newCode, normalizeCode } from "../lib/links/code";
import { publicChild, publicResult, requireHousehold, resultInput, resultKey } from "./household";

const CHILD_LINK_TTL = 7 * 24 * 3_600_000;
const DEVICE_TOKEN_TTL = 90 * 24 * 3_600_000;

function newToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
}

async function uniqueCode(ctx: MutationCtx, length: number): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = newCode(length);
    const taken =
      (await ctx.db.query("links").withIndex("by_code", (q) => q.eq("code", code)).first()) ||
      (await ctx.db.query("classrooms").withIndex("by_code", (q) => q.eq("code", code)).first()) ||
      (await ctx.db.query("assignments").withIndex("by_code", (q) => q.eq("code", code)).first());
    if (!taken) return code;
  }
  throw new Error("could not allocate a code");
}
export { uniqueCode };

/** A live device token or null. */
export async function deviceByToken(ctx: QueryCtx | MutationCtx, token: string): Promise<Doc<"deviceTokens"> | null> {
  if (!token) return null;
  const d = await ctx.db.query("deviceTokens").withIndex("by_token", (q) => q.eq("token", token)).unique();
  if (!d || d.revokedAt || d.expiresAt < Date.now()) return null;
  return d;
}

async function childOf(ctx: QueryCtx | MutationCtx, householdId: Id<"households">, clientId: string) {
  return ctx.db
    .query("children")
    .withIndex("by_household_client", (q) => q.eq("householdId", householdId).eq("clientId", clientId))
    .unique();
}

/* ---------------------------------------------------------------- resolve + redeem (public) */

/** What a code opens, for the join page. Never returns emails. */
export const resolve = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = normalizeCode(args.code);
    if (!isValidCode(code)) return null;
    const now = Date.now();
    const link = await ctx.db.query("links").withIndex("by_code", (q) => q.eq("code", code)).first();
    if (link) {
      if (link.revokedAt || link.expiresAt < now) return { kind: "expired" as const };
      const child = await childOf(ctx, link.householdId, link.childClientId);
      if (!child) return { kind: "expired" as const };
      return { kind: "child" as const, childName: child.name, grade: child.grade };
    }
    const room = await ctx.db.query("classrooms").withIndex("by_code", (q) => q.eq("code", code)).first();
    if (room && !room.archivedAt) return { kind: "class" as const, classroomName: room.name, teacherName: room.teacherName, grade: room.grade };
    const asg = await ctx.db.query("assignments").withIndex("by_code", (q) => q.eq("code", code)).first();
    if (asg) {
      const r = await ctx.db.get(asg.classroomId);
      if (r && !r.archivedAt) return { kind: "assignment" as const, classroomName: r.name, teacherName: r.teacherName, grade: r.grade, lessonId: asg.lessonId, note: asg.note ?? "" };
    }
    return null;
  },
});

/**
 * Attach this device. A child code returns the child (and history) and a
 * child-scoped token; a class or assignment code needs the student's name
 * (reused when this device already joined the class) and returns a
 * student-scoped token.
 */
export const redeem = mutation({
  args: { code: v.string(), deviceId: v.string(), name: v.optional(v.string()), label: v.optional(v.string()), clientChildId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const code = normalizeCode(args.code);
    if (!isValidCode(code) || !/^d_[a-z0-9]{6,32}$/.test(args.deviceId)) throw new Error("bad code");
    const now = Date.now();
    const label = (args.label ?? "").slice(0, 60);
    const link = await ctx.db.query("links").withIndex("by_code", (q) => q.eq("code", code)).first();
    if (link) {
      if (link.revokedAt || link.expiresAt < now) throw new Error("expired");
      const child = await childOf(ctx, link.householdId, link.childClientId);
      if (!child) throw new Error("expired");
      const token = newToken();
      await ctx.db.insert("deviceTokens", {
        token,
        kind: "child",
        deviceId: args.deviceId,
        label,
        householdId: link.householdId,
        childClientId: link.childClientId,
        createdAt: now,
        expiresAt: now + DEVICE_TOKEN_TTL,
        lastSeenAt: now,
      });
      await ctx.db.patch(link._id, { uses: link.uses + 1 });
      const results = (await ctx.db.query("results").withIndex("by_household_child", (q) => q.eq("householdId", link.householdId).eq("childClientId", link.childClientId)).collect()).map(publicResult);
      return { kind: "child" as const, token, child: publicChild(child), results };
    }
    let room = await ctx.db.query("classrooms").withIndex("by_code", (q) => q.eq("code", code)).first();
    let lessonId: string | undefined;
    if (!room) {
      const asg = await ctx.db.query("assignments").withIndex("by_code", (q) => q.eq("code", code)).first();
      if (!asg) throw new Error("unknown");
      room = await ctx.db.get(asg.classroomId);
      lessonId = asg.lessonId;
    }
    if (!room || room.archivedAt) throw new Error("unknown");
    let student = await ctx.db
      .query("students")
      .withIndex("by_classroom_device", (q) => q.eq("classroomId", room!._id).eq("deviceId", args.deviceId))
      .first();
    if (student?.removedAt) student = null;
    const name = (args.name ?? "").trim().slice(0, 40);
    if (!student) {
      if (!name) throw new Error("name required");
      const id = await ctx.db.insert("students", {
        classroomId: room._id,
        name,
        deviceId: args.deviceId,
        clientChildId: args.clientChildId ?? "",
        createdAt: now,
        lastSeenAt: now,
      });
      student = (await ctx.db.get(id))!;
    } else {
      await ctx.db.patch(student._id, { lastSeenAt: now, ...(name ? { name } : {}), ...(args.clientChildId ? { clientChildId: args.clientChildId } : {}) });
    }
    // One live token per device per class.
    const old = await ctx.db.query("deviceTokens").withIndex("by_student", (q) => q.eq("studentId", student!._id)).collect();
    for (const t of old) if (t.deviceId === args.deviceId && !t.revokedAt) await ctx.db.patch(t._id, { revokedAt: now });
    const token = newToken();
    await ctx.db.insert("deviceTokens", {
      token,
      kind: "student",
      deviceId: args.deviceId,
      label,
      classroomId: room._id,
      studentId: student._id,
      createdAt: now,
      expiresAt: now + DEVICE_TOKEN_TTL,
      lastSeenAt: now,
    });
    return { kind: "class" as const, token, classroomId: room._id, studentId: student._id, classroomName: room.name, teacherName: room.teacherName, grade: room.grade, studentName: student.name, lessonId };
  },
});

/* ---------------------------------------------------------------- parent side */

/** The parent's link for one child: reuses the live one, else mints a 5-char code valid for 7 days. */
export const createChildLink = mutation({
  args: { token: v.string(), childClientId: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const child = await childOf(ctx, h._id, args.childClientId);
    if (!child) throw new Error("no such child");
    const now = Date.now();
    const existing = (await ctx.db.query("links").withIndex("by_household", (q) => q.eq("householdId", h._id)).collect()).find(
      (l) => l.childClientId === args.childClientId && !l.revokedAt && l.expiresAt > now,
    );
    if (existing) return { code: existing.code, expiresAt: existing.expiresAt };
    const code = await uniqueCode(ctx, CHILD_CODE_LENGTH);
    await ctx.db.insert("links", { code, householdId: h._id, childClientId: args.childClientId, createdAt: now, expiresAt: now + CHILD_LINK_TTL, uses: 0 });
    return { code, expiresAt: now + CHILD_LINK_TTL };
  },
});

/** Devices attached to each child of the household. */
export const childDevices = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const now = Date.now();
    const tokens = await ctx.db.query("deviceTokens").withIndex("by_household", (q) => q.eq("householdId", h._id)).collect();
    return tokens
      .filter((t) => !t.revokedAt && t.expiresAt > now)
      .map((t) => ({ id: t._id, childClientId: t.childClientId ?? "", label: t.label ?? "", createdAt: t.createdAt, lastSeenAt: t.lastSeenAt }));
  },
});

export const revokeDevice = mutation({
  args: { token: v.string(), deviceTokenId: v.id("deviceTokens") },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const t = await ctx.db.get(args.deviceTokenId);
    if (!t || t.householdId !== h._id) throw new Error("not yours");
    await ctx.db.patch(t._id, { revokedAt: Date.now() });
    return { ok: true };
  },
});

/* ---------------------------------------------------------------- linked child device */

/** The linked child as the account has it now; null when the link was revoked. */
export const childStatus = query({
  args: { deviceToken: v.string() },
  handler: async (ctx, args) => {
    const d = await deviceByToken(ctx, args.deviceToken);
    if (!d || d.kind !== "child" || !d.householdId || !d.childClientId) return null;
    const child = await childOf(ctx, d.householdId, d.childClientId);
    return child ? publicChild(child) : null;
  },
});

/** A linked device reports its child's settings and finished sessions. Scoped to that one child. */
export const childSync = mutation({
  args: { deviceToken: v.string(), settings: v.optional(v.any()), results: v.array(resultInput) },
  handler: async (ctx, args) => {
    const d = await deviceByToken(ctx, args.deviceToken);
    if (!d || d.kind !== "child" || !d.householdId || !d.childClientId) throw new Error("link revoked");
    const child = await childOf(ctx, d.householdId, d.childClientId);
    if (!child) throw new Error("link revoked");
    const now = Date.now();
    if (args.settings) await ctx.db.patch(child._id, { settings: args.settings, updatedAt: now });
    let added = 0;
    for (const r of args.results) {
      const key = resultKey(r.lessonId, r.startedAt, r.endedAt);
      const existing = await ctx.db.query("results").withIndex("by_household_key", (q) => q.eq("householdId", d.householdId!).eq("key", key)).first();
      if (!existing) {
        await ctx.db.insert("results", { ...r, childClientId: d.childClientId, householdId: d.householdId, key, createdAt: now });
        added++;
      }
    }
    await ctx.db.patch(d._id, { lastSeenAt: now });
    await ctx.db.patch(d.householdId, { lastSyncAt: now });
    return { added, childName: child.name };
  },
});
