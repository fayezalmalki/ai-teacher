import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./admin";

export type GateMode = "open" | "code" | "closed";

export async function gateConfig(ctx: QueryCtx) {
  const doc = await ctx.db.query("appConfig").withIndex("by_key", (q) => q.eq("key", "gate")).unique();
  const mode: GateMode = doc?.mode === "code" || doc?.mode === "closed" ? doc.mode : "open";
  return { mode, code: doc?.code ?? "", message: doc?.message ?? "", doc };
}

/** What every visitor may know: the mode and the message. Never the code. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const g = await gateConfig(ctx);
    return { mode: g.mode, message: g.message };
  },
});

/** True when the visitor may pass: the gate is open, or the code matches. */
export const check = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const g = await gateConfig(ctx);
    if (g.mode === "open") return true;
    if (g.mode === "closed") return false;
    return g.code.length > 0 && code.trim() === g.code;
  },
});

/** Admin: switch the gate. */
export const set = mutation({
  args: { token: v.string(), mode: v.string(), code: v.optional(v.string()), message: v.optional(v.string()) },
  handler: async (ctx, { token, mode, code, message }) => {
    await requireAdmin(ctx, token);
    if (mode !== "open" && mode !== "code" && mode !== "closed") throw new Error("bad mode");
    if (mode === "code" && !(code ?? "").trim()) throw new Error("code required");
    const g = await gateConfig(ctx);
    const patch = { key: "gate", mode, code: (code ?? "").trim().slice(0, 40), message: (message ?? "").trim().slice(0, 300), updatedAt: Date.now() };
    if (g.doc) await ctx.db.patch(g.doc._id, patch);
    else await ctx.db.insert("appConfig", patch);
    return { ok: true };
  },
});
