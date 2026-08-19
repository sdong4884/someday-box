import { describe, expect, it } from "vitest";

import {
  addKstDays,
  addKstYears,
  isKstDateString,
  KST_OFFSET_MS,
  kstDateStringToUtc,
  startOfKstDay,
  toKstDateString,
} from "@/domain/kstDate";

describe("isKstDateString", () => {
  it.each(["2026-08-12", "2024-02-29", "2026-01-01", "2026-12-31"])(
    "%s 는 통과한다",
    (value) => {
      expect(isKstDateString(value)).toBe(true);
    },
  );

  it.each([
    ["", "빈 문자열"],
    ["2026-1-1", "0 패딩 없음"],
    ["20260101", "구분자 없음"],
    ["2026-08-12T00:00:00Z", "시각이 붙음"],
    ["2026-13-01", "13월"],
    ["2026-00-10", "0월"],
    ["2026-02-30", "2월 30일"],
    ["2026-04-31", "4월 31일"],
    ["2026-02-29", "평년의 2월 29일"],
    ["0099-01-01", "두 자리 연도로 해석될 값"],
  ])("%s 는 거부한다 (%s)", (value) => {
    expect(isKstDateString(value)).toBe(false);
  });
});

describe("kstDateStringToUtc", () => {
  it("KST 00:00 을 UTC 로 옮긴다 — 전날 15:00Z 가 된다", () => {
    expect(kstDateStringToUtc("2027-01-01").toISOString()).toBe(
      "2026-12-31T15:00:00.000Z",
    );
  });

  it("오프셋은 정확히 9시간이다", () => {
    const value = "2026-08-12";

    expect(kstDateStringToUtc(value).getTime()).toBe(
      Date.parse(`${value}T00:00:00.000Z`) - KST_OFFSET_MS,
    );
  });

  it("잘못된 값은 던진다", () => {
    expect(() => kstDateStringToUtc("2026-02-30")).toThrow(RangeError);
  });
});

describe("toKstDateString", () => {
  // KST 자정은 UTC 15:00 이다. 이 경계에서 날짜가 넘어가야 "오늘" 판정이 맞는다.
  it("14:59:59Z 는 아직 같은 날이다", () => {
    expect(toKstDateString(new Date("2026-12-31T14:59:59.999Z"))).toBe(
      "2026-12-31",
    );
  });

  it("15:00:00Z 부터 다음 날이다", () => {
    expect(toKstDateString(new Date("2026-12-31T15:00:00.000Z"))).toBe(
      "2027-01-01",
    );
  });

  it.each(["2026-08-12", "2024-02-29", "2026-01-01", "2026-12-31"])(
    "%s 는 왕복해도 그대로다",
    (value) => {
      expect(toKstDateString(kstDateStringToUtc(value))).toBe(value);
    },
  );
});

describe("startOfKstDay", () => {
  it("하루 중 어느 시각이든 그날 KST 00:00 으로 접힌다", () => {
    const midnight = kstDateStringToUtc("2026-08-12");

    // KST 8/12 의 00:00, 14:00, 23:59:59.999
    for (const now of [
      midnight,
      new Date("2026-08-12T05:00:00.000Z"),
      new Date("2026-08-12T14:59:59.999Z"),
    ]) {
      expect(startOfKstDay(now).getTime()).toBe(midnight.getTime());
    }
  });

  it("인자를 변형하지 않는다", () => {
    const now = new Date("2026-08-12T05:00:00.000Z");

    startOfKstDay(now);

    expect(now.toISOString()).toBe("2026-08-12T05:00:00.000Z");
  });
});

describe("addKstYears", () => {
  it("연도만 더한다", () => {
    expect(addKstYears("2026-08-12", 10)).toBe("2036-08-12");
  });

  it("0 을 더하면 그대로다", () => {
    expect(addKstYears("2026-08-12", 0)).toBe("2026-08-12");
  });

  // Postgres 의 interval '10 years' 와 같은 결과여야 한다 (2038-03-01 이 아니다).
  it("2월 29일에서 평년으로 가면 말일로 당긴다", () => {
    expect(addKstYears("2028-02-29", 10)).toBe("2038-02-28");
  });

  it("윤년에서 윤년으로 가면 29일이 유지된다", () => {
    expect(addKstYears("2028-02-29", 4)).toBe("2032-02-29");
  });

  it("잘못된 값은 던진다", () => {
    expect(() => addKstYears("2026-1-1", 10)).toThrow(RangeError);
  });
});

describe("addKstDays", () => {
  it("일수를 더한다", () => {
    expect(addKstDays("2026-08-12", 1)).toBe("2026-08-13");
    expect(addKstDays("2026-08-12", 2)).toBe("2026-08-14");
  });

  it("0 을 더하면 그대로다", () => {
    expect(addKstDays("2026-08-12", 0)).toBe("2026-08-12");
  });

  it("월말을 넘긴다", () => {
    expect(addKstDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addKstDays("2026-04-30", 1)).toBe("2026-05-01");
  });

  it("연말을 넘긴다", () => {
    expect(addKstDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  // addKstYears 와 달리 클램프가 없다 — 넘침이 그대로 다음 날짜가 된다.
  it("윤년의 2월 29일을 만든다", () => {
    expect(addKstDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addKstDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("음수도 더한다", () => {
    expect(addKstDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("잘못된 값은 던진다", () => {
    expect(() => addKstDays("2026-1-1", 1)).toThrow(RangeError);
    expect(() => addKstDays("2026-02-30", 1)).toThrow(RangeError);
  });
});
