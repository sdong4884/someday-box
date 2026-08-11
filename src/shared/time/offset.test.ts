import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DAY_MS,
  OFFSET_STEPS,
  isTimeTravelEnabled,
  parseOffset,
  readOffset,
} from "@/shared/time/offset";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseOffset", () => {
  it("숫자 문자열을 밀리초로 읽는다", () => {
    expect(parseOffset("86400000")).toBe(DAY_MS);
    expect(parseOffset("-86400000")).toBe(-DAY_MS);
    expect(parseOffset("0")).toBe(0);
  });

  it("해석할 수 없는 값은 0 이다", () => {
    for (const raw of [null, "", "   ", "abc", "NaN", "Infinity", "1일"]) {
      expect(parseOffset(raw)).toBe(0);
    }
  });
});

describe("readOffset", () => {
  it("localStorage 가 없는 환경(서버)에서는 0 이다", () => {
    expect(typeof window).toBe("undefined");
    expect(readOffset()).toBe(0);
  });

  it("프로덕션에서는 0 이다", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(readOffset()).toBe(0);
  });
});

describe("isTimeTravelEnabled", () => {
  it("프로덕션에서만 꺼진다", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isTimeTravelEnabled()).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    expect(isTimeTravelEnabled()).toBe(true);
  });
});

describe("OFFSET_STEPS", () => {
  it("+1일 / +30일 / +1년 이다", () => {
    expect(OFFSET_STEPS.map((step) => step.label)).toEqual([
      "+1일",
      "+30일",
      "+1년",
    ]);
    expect(OFFSET_STEPS.map((step) => step.ms)).toEqual([
      DAY_MS,
      30 * DAY_MS,
      365 * DAY_MS,
    ]);
  });

  it("누적하면 일수가 더해진다", () => {
    const total = OFFSET_STEPS.reduce((sum, step) => sum + step.ms, 0);

    expect(Math.round(total / DAY_MS)).toBe(396);
  });
});
