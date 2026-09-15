import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { EVENT_KINDS } from "../lib/telemetry/aggregate";

const clip = (s: string | undefined, n: number) => (s ? s.slice(0, n) : undefined);

/** Records one usage event from a device. Public: no token, no personal data. */
export const track = mutation({
  args: {
    deviceId: v.string(),
    kind: v.string(),
    path: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    ref: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^d_[a-z0-9]{6,32}$/.test(args.deviceId)) return;
    if (!(EVENT_KINDS as string[]).includes(args.kind)) return;
    await ctx.db.insert("events", {
      deviceId: args.deviceId,
      kind: args.kind,
      path: clip(args.path, 120),
      lessonId: clip(args.lessonId, 40),
      ref: clip(args.ref, 120),
      device: args.device === "mobile" || args.device === "desktop" ? args.device : undefined,
      ts: Date.now(),
    });
  },
});
