import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const markSent = internalMutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.householdId, { lastDigestAt: Date.now() });
  },
});
