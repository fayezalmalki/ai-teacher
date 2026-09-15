import { describe, expect, it } from "vitest";
import { dayKey, summarize } from "./aggregate";

const now = Date.UTC(2026, 8, 15, 12, 0, 0); // 15 Sep 2026 12:00 UTC = 15:00 Riyadh
const h = 3_600_000;

describe("usage aggregation", () => {
  it("counts visits, devices and lessons inside the window only", () => {
    const s = summarize(
      [
        { deviceId: "a", kind: "first_visit", ts: now - 2 * h },
        { deviceId: "a", kind: "visit", ts: now - 2 * h, device: "mobile", ref: "x.com", path: "/" },
        { deviceId: "a", kind: "lesson_start", ts: now - h, lessonId: "fractions" },
        { deviceId: "a", kind: "lesson_end", ts: now - h / 2, lessonId: "fractions" },
        { deviceId: "b", kind: "visit", ts: now - 30 * h, device: "desktop", path: "/subjects" },
        { deviceId: "b", kind: "onboarded", ts: now - 29 * h },
        { deviceId: "old", kind: "visit", ts: now - 10 * 24 * h },
      ],
      now,
      7,
    );
    expect(s.totals).toEqual({ visits: 2, devices: 2, newDevices: 1, onboarded: 1, lessonStarts: 1, lessonEnds: 1, mobile: 1, desktop: 1 });
    expect(s.daily).toHaveLength(7);
    expect(s.daily[6].day).toBe("2026-09-15");
    expect(s.daily[6]).toMatchObject({ visits: 1, devices: 1, starts: 1, ends: 1 });
    expect(s.daily[5]).toMatchObject({ day: "2026-09-14", visits: 1, devices: 1 });
    expect(s.lessons).toEqual([{ lessonId: "fractions", starts: 1, ends: 1 }]);
    expect(s.referrers).toEqual([{ ref: "x.com", visits: 1 }]);
    expect(s.pages.map((p) => p.path).sort()).toEqual(["/", "/subjects"]);
  });

  it("cuts days at Riyadh midnight", () => {
    // 22:30 UTC on the 14th is 01:30 on the 15th in Riyadh.
    expect(dayKey(Date.UTC(2026, 8, 14, 22, 30))).toBe("2026-09-15");
  });
});
