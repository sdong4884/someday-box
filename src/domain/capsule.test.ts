import { describe, expect, it } from "vitest";

import {
  getCapsuleStatus,
  type CapsulePeriod,
  writeUntilDisplayDate,
  writeUntilFromKstDate,
} from "@/domain/capsule";
import { toKstDateString } from "@/domain/kstDate";

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

describe("writeUntilFromKstDate", () => {
  it("고른 날짜의 다음날 KST 00:00 이다", () => {
    expect(writeUntilFromKstDate("2026-12-25").toISOString()).toBe(
      "2026-12-25T15:00:00.000Z",
    );
  });

  it("고른 날짜가 끝나는 순간까지 WRITING 이다", () => {
    const period: CapsulePeriod = {
      writeUntil: writeUntilFromKstDate("2026-12-25"),
      openAt: new Date("2027-01-01T00:00:00.000Z"),
    };

    // 12/25 23:59:59.999 KST = 12/25T14:59:59.999Z
    expect(
      getCapsuleStatus(period, new Date("2026-12-25T14:59:59.999Z")),
    ).toBe("WRITING");
    expect(getCapsuleStatus(period, new Date("2026-12-25T15:00:00.000Z"))).toBe(
      "LOCKED",
    );
  });

  it.each([
    ["2026-12-31", "2026-12-31T15:00:00.000Z", "연말"],
    ["2028-02-28", "2028-02-28T15:00:00.000Z", "윤년 2/28"],
    ["2028-02-29", "2028-02-29T15:00:00.000Z", "윤년 2/29"],
    ["2026-01-31", "2026-01-31T15:00:00.000Z", "월말"],
  ])("%s → %s (%s)", (picked, expected) => {
    expect(writeUntilFromKstDate(picked).toISOString()).toBe(expected);
  });

  it("형식이 아닌 값은 깬다", () => {
    expect(() => writeUntilFromKstDate("2026-13-01")).toThrow(RangeError);
  });
});

describe("writeUntilDisplayDate", () => {
  it("저장값의 전날 KST 00:00 이다", () => {
    expect(
      writeUntilDisplayDate(new Date("2026-12-25T15:00:00.000Z")).toISOString(),
    ).toBe("2026-12-24T15:00:00.000Z");
  });

  it.each([
    "2026-12-25",
    "2026-12-31",
    "2027-01-01",
    "2028-02-29",
    "2026-01-31",
  ])("%s 는 왕복해도 그대로다", (picked) => {
    expect(toKstDateString(writeUntilDisplayDate(writeUntilFromKstDate(picked)))).toBe(
      picked,
    );
  });

  it("자정이 아닌 저장값도 KST 기준 전날로 되돌린다", () => {
    // 마이그레이션 이전에 임의 시각으로 들어간 행. 2026-08-09 15:34 KST 의 전날.
    expect(
      toKstDateString(writeUntilDisplayDate(new Date("2026-08-09T06:34:33.679Z"))),
    ).toBe("2026-08-08");
  });

  it("인자를 변형하지 않는다", () => {
    const writeUntil = new Date("2026-12-25T15:00:00.000Z");
    const before = writeUntil.getTime();

    writeUntilDisplayDate(writeUntil);

    expect(writeUntil.getTime()).toBe(before);
  });
});
