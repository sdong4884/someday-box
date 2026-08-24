import { describe, expect, it } from "vitest";

import { formatDdayLabel } from "@/features/capsule/model/dday";

describe("formatDdayLabel", () => {
  it("남은 날수를 D-n 으로 적는다", () => {
    expect(formatDdayLabel(7)).toBe("D-7");
  });

  it("하루 남으면 D-1 이다", () => {
    expect(formatDdayLabel(1)).toBe("D-1");
  });

  it("당일은 D-0 이 아니라 D-DAY 다", () => {
    expect(formatDdayLabel(0)).toBe("D-DAY");
  });

  it("음수도 D-DAY 로 접는다 — D--1 이 찍히지 않게", () => {
    expect(formatDdayLabel(-3)).toBe("D-DAY");
  });

  it("세 자리도 그대로 적는다", () => {
    expect(formatDdayLabel(365)).toBe("D-365");
  });
});
