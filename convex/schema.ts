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

  /** A teacher's class. `code` is the permanent join code (/j/<code>); the owner is a household (teacher email). */
  classrooms: defineTable({
    ownerHouseholdId: v.id("households"),
    name: v.string(),
    teacherName: v.string(),
    grade: v.number(),
    code: v.string(),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerHouseholdId"])
    .index("by_code", ["code"]),

  /** One student device in a class. The same child on two devices is two rows the teacher can merge by name later. */
  students: defineTable({
    classroomId: v.id("classrooms"),
    name: v.string(),
    deviceId: v.string(),
    /** The child id on the device, so results map back. */
    clientChildId: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_classroom_device", ["classroomId", "deviceId"]),

  /** "Do this lesson after today's class": a lesson link for one classroom. */
  assignments: defineTable({
    classroomId: v.id("classrooms"),
    lessonId: v.string(),
    code: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_code", ["code"]),

  /** A parent's link for one child: attaches a device to that child. Expires; one active per child. */
  links: defineTable({
    code: v.string(),
    householdId: v.id("households"),
    childClientId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    uses: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_household", ["householdId"]),

  /** What a linked device holds: a child-scoped or student-scoped bearer token. */
  deviceTokens: defineTable({
    token: v.string(),
    kind: v.string(),
    deviceId: v.string(),
    label: v.optional(v.string()),
    householdId: v.optional(v.id("households")),
    childClientId: v.optional(v.string()),
    classroomId: v.optional(v.id("classrooms")),
    studentId: v.optional(v.id("students")),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastSeenAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_household", ["householdId"])
    .index("by_student", ["studentId"]),

  /** A finished session reported to a classroom by a student device. */
  classResults: defineTable({
    classroomId: v.id("classrooms"),
    studentId: v.id("students"),
    lessonId: v.string(),
    key: v.string(),
    startedAt: v.union(v.number(), v.null()),
    endedAt: v.union(v.number(), v.null()),
    questions: v.number(),
    correct: v.number(),
    reexplain: v.number(),
    startDifficulty: v.number(),
    endDifficulty: v.number(),
    rating: v.string(),
    concepts: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_student_key", ["studentId", "key"]),

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
