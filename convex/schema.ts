import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * A household is one parent email. Children and their finished sessions are
 * mirrored here from each device's local store (lib/store/state.ts), keyed by
 * the ids the device generated, so the same child on two phones stays one row.
 */
export default defineSchema({
  households: defineTable({
    email: v.string(),
    createdAt: v.number(),
    /** Weekly summary email (Sunday morning Riyadh). */
    digestOptIn: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastDigestAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  /** Bearer sessions handed out after a verified email code. */
  householdSessions: defineTable({
    householdId: v.id("households"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_household", ["householdId"]),

  /** Short-lived email sign-in codes, sha256-hashed at rest (see authEmail.ts). */
  authCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
    sendCount: v.optional(v.number()),
    firstSentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  children: defineTable({
    householdId: v.id("households"),
    /** The id the device generated (lib/store/state.ts newId). */
    clientId: v.string(),
    name: v.string(),
    age: v.number(),
    grade: v.number(),
    color: v.string(),
    /** ChildSettings as stored on the device. */
    settings: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_household_client", ["householdId", "clientId"]),

  /** One finished session. `key` = lessonId:startedAt dedupes re-syncs. */
  results: defineTable({
    householdId: v.id("households"),
    childClientId: v.string(),
    key: v.string(),
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
    createdAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_household_key", ["householdId", "key"])
    .index("by_household_child", ["householdId", "childClientId"]),

  /**
   * Usage events from every device, signed in or not, for the admin page.
   * No names, emails or transcripts: a random device id, what happened, when.
   */
  events: defineTable({
    deviceId: v.string(),
    /** visit | first_visit | page | onboarded | lesson_start | lesson_end */
    kind: v.string(),
    path: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    /** Referrer host, if any. */
    ref: v.optional(v.string()),
    /** mobile | desktop */
    device: v.optional(v.string()),
    ts: v.number(),
  })
    .index("by_ts", ["ts"])
    .index("by_device", ["deviceId"]),

  /** Single-row app settings, keyed by name (e.g. "gate"). */
  appConfig: defineTable({
    key: v.string(),
    /** gate: open | code | closed */
    mode: v.optional(v.string()),
    code: v.optional(v.string()),
    message: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
