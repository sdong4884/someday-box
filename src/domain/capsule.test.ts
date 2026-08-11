import { describe, expect, it } from "vitest";

import { getCapsuleStatus, type CapsulePeriod } from "@/domain/capsule";

const WRITE_UNTIL = Date.parse("2026-09-01T00:00:00.000Z");
const OPEN_AT = Date.parse("2026-12-25T00:00:00.000Z");

const PERIOD: CapsulePeriod = {
  writeUntil: new Date(WRITE_UNTIL),
  openAt: new Date(OPEN_AT),
};

/** 기준 시각에서 밀리초만큼 떨어진 시각으로 판정한다. */
const statusAt = (baseMs: number, offsetMs = 0) =>
  getCapsuleStatus(PERIOD, new Date(baseMs + offsetMs));

describe("getCapsuleStatus", () => {
  it("입력 마감 전에는 WRITING 이다", () => {
    expect(statusAt(WRITE_UNTIL, -30 * 24 * 60 * 60 * 1000)).toBe("WRITING");
  });

  it("두 시각 사이에는 LOCKED 다", () => {
    expect(statusAt((WRITE_UNTIL + OPEN_AT) / 2)).toBe("LOCKED");
  });

  it("만료 후에는 OPENED 다", () => {
    expect(statusAt(OPEN_AT, 365 * 24 * 60 * 60 * 1000)).toBe("OPENED");
  });

  // 경계는 DB 의 `now() >= write_until` / `now() >= open_at` 과 같은 방향이어야 한다.
  describe("writeUntil 경계", () => {
    it("1ms 전은 WRITING 이다", () => {
      expect(statusAt(WRITE_UNTIL, -1)).toBe("WRITING");
    });

    it("정각은 LOCKED 다", () => {
      expect(statusAt(WRITE_UNTIL)).toBe("LOCKED");
    });

    it("1ms 후는 LOCKED 다", () => {
      expect(statusAt(WRITE_UNTIL, 1)).toBe("LOCKED");
    });
  });

  describe("openAt 경계", () => {
    it("1ms 전은 LOCKED 다", () => {
      expect(statusAt(OPEN_AT, -1)).toBe("LOCKED");
    });

    it("정각은 OPENED 다", () => {
      expect(statusAt(OPEN_AT)).toBe("OPENED");
    });

    it("1ms 후는 OPENED 다", () => {
      expect(statusAt(OPEN_AT, 1)).toBe("OPENED");
    });
  });

  describe("순수 함수", () => {
    it("같은 인자면 같은 결과가 나온다", () => {
      const now = new Date(OPEN_AT);

      expect(getCapsuleStatus(PERIOD, now)).toBe(
        getCapsuleStatus(PERIOD, now),
      );
    });

    it("인자를 변형하지 않는다", () => {
      const period: CapsulePeriod = {
        writeUntil: new Date(WRITE_UNTIL),
        openAt: new Date(OPEN_AT),
      };
      const now = new Date(WRITE_UNTIL);

      getCapsuleStatus(period, now);

      expect(period.writeUntil.getTime()).toBe(WRITE_UNTIL);
      expect(period.openAt.getTime()).toBe(OPEN_AT);
      expect(now.getTime()).toBe(WRITE_UNTIL);
    });
  });
});
