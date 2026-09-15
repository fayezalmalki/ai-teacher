import { describe, expect, it } from "vitest";
import { minutesLabel, sessionMinutes } from "./selectors";

describe("minutesLabel", () => {
  it("agrees the noun with the number", () => {
    expect(minutesLabel(1)).toBe("دقيقة واحدة");
    expect(minutesLabel(2)).toBe("دقيقتان");
    expect(minutesLabel(3)).toBe("3 دقائق");
    expect(minutesLabel(10)).toBe("10 دقائق");
    expect(minutesLabel(11)).toBe("11 دقيقة");
  });
});

describe("sessionMinutes", () => {
  it("never reports less than one minute", () => {
    expect(sessionMinutes(null, null)).toBe(1);
    expect(sessionMinutes(1000, 5000)).toBe(1);
    expect(sessionMinutes(60000, 10 * 60000)).toBe(9);
  });
});
