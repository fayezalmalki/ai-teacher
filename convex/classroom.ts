import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { CLASS_CODE_LENGTH } from "../lib/links/code";
import { requireHousehold, resultKey } from "./household";
import { deviceByToken, uniqueCode } from "./links";

async function ownRoom(ctx: QueryCtx | MutationCtx, token: string, classroomId: Id<"classrooms">): Promise<Doc<"classrooms">> {
  const h = await requireHousehold(ctx, token);
  const room = await ctx.db.get(classroomId);
  if (!room || room.ownerHouseholdId !== h._id) throw new Error("not yours");
  return room;
}

/* ---------------------------------------------------------------- teacher */

export const create = mutation({
  args: { token: v.string(), name: v.string(), teacherName: v.string(), grade: v.number() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const name = args.name.trim().slice(0, 60);
    const teacherName = args.teacherName.trim().slice(0, 60);
    if (!name || !teacherName) throw new Error("name required");
    const code = await uniqueCode(ctx, CLASS_CODE_LENGTH);
    const id = await ctx.db.insert("classrooms", { ownerHouseholdId: h._id, name, teacherName, grade: Math.max(1, Math.min(6, Math.round(args.grade))), code, createdAt: Date.now() });
    return { id, code };
  },
});

/** The teacher's classes with counts. */
export const mine = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const h = await requireHousehold(ctx, args.token);
    const rooms = await ctx.db.query("classrooms").withIndex("by_owner", (q) => q.eq("ownerHouseholdId", h._id)).collect();
    const out = [];
    for (const r of rooms.filter((r) => !r.archivedAt)) {
      const students = await ctx.db.query("students").withIndex("by_classroom", (q) => q.eq("classroomId", r._id)).collect();
      const assignments = await ctx.db.query("assignments").withIndex("by_classroom", (q) => q.eq("classroomId", r._id)).collect();
      out.push({ id: r._id, name: r.name, teacherName: r.teacherName, grade: r.grade, code: r.code, createdAt: r.createdAt, students: students.filter((s) => !s.removedAt).length, assignments: assignments.length });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** One class: roster, assignments and every reported session, for the results table. */
export const get = query({
  args: { token: v.string(), classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const room = await ownRoom(ctx, args.token, args.classroomId);
    const students = (await ctx.db.query("students").withIndex("by_classroom", (q) => q.eq("classroomId", room._id)).collect())
      .filter((s) => !s.removedAt)
      .map((s) => ({ id: s._id, name: s.name, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt }))
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
    const assignments = (await ctx.db.query("assignments").withIndex("by_classroom", (q) => q.eq("classroomId", room._id)).collect())
      .map((a) => ({ id: a._id, lessonId: a.lessonId, code: a.code, note: a.note ?? "", createdAt: a.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
    const results = (await ctx.db.query("classResults").withIndex("by_classroom", (q) => q.eq("classroomId", room._id)).collect()).map((r) => ({
      studentId: r.studentId,
      lessonId: r.lessonId,
      questions: r.questions,
      correct: r.correct,
      reexplain: r.reexplain,
      startDifficulty: r.startDifficulty,
      endDifficulty: r.endDifficulty,
      rating: r.rating,
      concepts: r.concepts as Record<string, { asked: number; correct: number }> | undefined,
      endedAt: r.endedAt ?? r.createdAt,
      createdAt: r.createdAt,
    }));
    return { id: room._id, name: room.name, teacherName: room.teacherName, grade: room.grade, code: room.code, createdAt: room.createdAt, students, assignments, results };
  },
});

/** "Do this lesson": a 6-char code for one lesson in this class. Reuses an existing one for the same lesson. */
export const assign = mutation({
  args: { token: v.string(), classroomId: v.id("classrooms"), lessonId: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const room = await ownRoom(ctx, args.token, args.classroomId);
    const existing = (await ctx.db.query("assignments").withIndex("by_classroom", (q) => q.eq("classroomId", room._id)).collect()).find((a) => a.lessonId === args.lessonId);
    if (existing) {
      if (args.note !== undefined) await ctx.db.patch(existing._id, { note: args.note.trim().slice(0, 140) });
      return { id: existing._id, code: existing.code };
    }
    const code = await uniqueCode(ctx, CLASS_CODE_LENGTH);
    const id = await ctx.db.insert("assignments", { classroomId: room._id, lessonId: args.lessonId, code, note: (args.note ?? "").trim().slice(0, 140) || undefined, createdAt: Date.now() });
    return { id, code };
  },
});

export const removeStudent = mutation({
  args: { token: v.string(), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.studentId);
    if (!s) return { ok: true };
    await ownRoom(ctx, args.token, s.classroomId);
    await ctx.db.patch(s._id, { removedAt: Date.now() });
    const tokens = await ctx.db.query("deviceTokens").withIndex("by_student", (q) => q.eq("studentId", s._id)).collect();
    for (const t of tokens) if (!t.revokedAt) await ctx.db.patch(t._id, { revokedAt: Date.now() });
    return { ok: true };
  },
});

export const renameStudent = mutation({
  args: { token: v.string(), studentId: v.id("students"), name: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.studentId);
    if (!s) throw new Error("unknown");
    await ownRoom(ctx, args.token, s.classroomId);
    const name = args.name.trim().slice(0, 40);
    if (!name) throw new Error("name required");
    await ctx.db.patch(s._id, { name });
    return { ok: true };
  },
});

export const archive = mutation({
  args: { token: v.string(), classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const room = await ownRoom(ctx, args.token, args.classroomId);
    await ctx.db.patch(room._id, { archivedAt: Date.now() });
    return { ok: true };
  },
});

/* ---------------------------------------------------------------- student device */

/** What the student's device shows: class, name and the lessons the teacher asked for. Null when removed. */
export const studentStatus = query({
  args: { deviceToken: v.string() },
  handler: async (ctx, args) => {
    const d = await deviceByToken(ctx, args.deviceToken);
    if (!d || d.kind !== "student" || !d.classroomId || !d.studentId) return null;
    const room = await ctx.db.get(d.classroomId);
    const student = await ctx.db.get(d.studentId);
    if (!room || room.archivedAt || !student || student.removedAt) return null;
    const assignments = (await ctx.db.query("assignments").withIndex("by_classroom", (q) => q.eq("classroomId", room._id)).collect())
      .map((a) => ({ lessonId: a.lessonId, note: a.note ?? "", createdAt: a.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return { classroomName: room.name, teacherName: room.teacherName, grade: room.grade, studentName: student.name, assignments };
  },
});

const classResultInput = v.object({
  lessonId: v.string(),
  startedAt: v.union(v.number(), v.null()),
  endedAt: v.union(v.number(), v.null()),
  questions: v.number(),
  correct: v.number(),
  reexplain: v.number(),
  startDifficulty: v.number(),
  endDifficulty: v.number(),
  rating: v.string(),
  concepts: v.optional(v.any()),
});

/** A student device reports finished sessions to its class. Once per lesson start. */
export const studentSync = mutation({
  args: { deviceToken: v.string(), results: v.array(classResultInput) },
  handler: async (ctx, args) => {
    const d = await deviceByToken(ctx, args.deviceToken);
    if (!d || d.kind !== "student" || !d.classroomId || !d.studentId) throw new Error("link revoked");
    const student = await ctx.db.get(d.studentId);
    if (!student || student.removedAt) throw new Error("link revoked");
    const now = Date.now();
    let added = 0;
    for (const r of args.results) {
      const key = resultKey(r.lessonId, r.startedAt, r.endedAt);
      const existing = await ctx.db.query("classResults").withIndex("by_student_key", (q) => q.eq("studentId", d.studentId!).eq("key", key)).first();
      if (!existing) {
        await ctx.db.insert("classResults", { ...r, classroomId: d.classroomId, studentId: d.studentId, key, createdAt: now });
        added++;
      }
    }
    await ctx.db.patch(d._id, { lastSeenAt: now });
    await ctx.db.patch(student._id, { lastSeenAt: now });
    return { added };
  },
});
