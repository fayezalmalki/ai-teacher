/**
 * Pure aggregation of usage events for the admin page. Shared by the Convex
 * query (convex/admin.ts) and its unit test, so it must stay dependency-free.
 */
export type EventKind = "visit" | "first_visit" | "page" | "onboarded" | "lesson_start" | "lesson_end";
export const EVENT_KINDS: EventKind[] = ["visit", "first_visit", "page", "onboarded", "lesson_start", "lesson_end"];

export interface UsageEvent {
  deviceId: string;
  kind: string;
  ts: number;
  lessonId?: string;
  device?: string;
  path?: string;
  ref?: string;
}

export interface DailyRow {
  /** YYYY-MM-DD in the aggregation time zone. */
  day: string;
  visits: number;
  devices: number;
  starts: number;
  ends: number;
}

export interface UsageSummary {
  days: number;
  totals: {
    visits: number;
    devices: number;
    newDevices: number;
    onboarded: number;
    lessonStarts: number;
    lessonEnds: number;
    mobile: number;
    desktop: number;
  };
  daily: DailyRow[];
  lessons: { lessonId: string; starts: number; ends: number }[];
  referrers: { ref: string; visits: number }[];
  pages: { path: string; views: number }[];
}

/** Riyadh is UTC+3 all year; days are cut at local midnight. */
export const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

export function dayKey(ts: number, offsetMs = TZ_OFFSET_MS): string {
  return new Date(ts + offsetMs).toISOString().slice(0, 10);
}

export function summarize(events: UsageEvent[], now: number, days: number, offsetMs = TZ_OFFSET_MS): UsageSummary {
  const since = now - days * 86_400_000;
  const inRange = events.filter((e) => e.ts >= since && e.ts <= now);

  const daily = new Map<string, DailyRow & { deviceSet: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * 86_400_000, offsetMs);
    daily.set(key, { day: key, visits: 0, devices: 0, starts: 0, ends: 0, deviceSet: new Set() });
  }

  const devices = new Set<string>();
  const mobile = new Set<string>();
  const desktop = new Set<string>();
  const lessons = new Map<string, { starts: number; ends: number }>();
  const referrers = new Map<string, number>();
  const pages = new Map<string, number>();
  const totals = { visits: 0, devices: 0, newDevices: 0, onboarded: 0, lessonStarts: 0, lessonEnds: 0, mobile: 0, desktop: 0 };

  for (const e of inRange) {
    devices.add(e.deviceId);
    if (e.device === "mobile") mobile.add(e.deviceId);
    else if (e.device === "desktop") desktop.add(e.deviceId);
    const row = daily.get(dayKey(e.ts, offsetMs));
    if (row) row.deviceSet.add(e.deviceId);
    switch (e.kind) {
      case "visit":
        totals.visits++;
        if (row) row.visits++;
        if (e.ref) referrers.set(e.ref, (referrers.get(e.ref) ?? 0) + 1);
        if (e.path) pages.set(e.path, (pages.get(e.path) ?? 0) + 1);
        break;
      case "first_visit":
        totals.newDevices++;
        break;
      case "page":
        if (e.path) pages.set(e.path, (pages.get(e.path) ?? 0) + 1);
        break;
      case "onboarded":
        totals.onboarded++;
        break;
      case "lesson_start": {
        totals.lessonStarts++;
        if (row) row.starts++;
        const l = lessons.get(e.lessonId ?? "?") ?? { starts: 0, ends: 0 };
        l.starts++;
        lessons.set(e.lessonId ?? "?", l);
        break;
      }
      case "lesson_end": {
        totals.lessonEnds++;
        if (row) row.ends++;
        const l = lessons.get(e.lessonId ?? "?") ?? { starts: 0, ends: 0 };
        l.ends++;
        lessons.set(e.lessonId ?? "?", l);
        break;
      }
    }
  }
  totals.devices = devices.size;
  totals.mobile = mobile.size;
  totals.desktop = desktop.size;

  const ranked = (m: Map<string, number>, n = 8) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  return {
    days,
    totals,
    daily: [...daily.values()].map(({ deviceSet, ...row }) => ({ ...row, devices: deviceSet.size })),
    lessons: [...lessons.entries()].map(([lessonId, c]) => ({ lessonId, ...c })).sort((a, b) => b.starts - a.starts),
    referrers: ranked(referrers).map(([ref, visits]) => ({ ref, visits })),
    pages: ranked(pages).map(([path, views]) => ({ path, views })),
  };
}
