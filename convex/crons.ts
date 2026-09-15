import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly parent summary: Sunday 06:00 UTC = 09:00 Riyadh.
crons.weekly("weekly parent digest", { dayOfWeek: "sunday", hourUTC: 6, minuteUTC: 0 }, internal.digest.weekly, {});

export default crons;
