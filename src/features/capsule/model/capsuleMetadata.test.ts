import { describe, expect, it } from "vitest";

import type { CapsulePeriod } from "@/domain/capsule";
import { buildCapsuleDescription } from "@/features/capsule/model/capsuleMetadata";

const PERIOD: CapsulePeriod = {
  writeUntil: new Date("2026-12-25T00:00:00.000Z"),
  openAt: new Date("2027-01-01T00:00:00.000Z"),
};

describe("buildCapsuleDescription", () => {
  it("두 날짜를 연도까지 적는다", () => {
    expect(buildCapsuleDescription(PERIOD)).toBe(
      "2026년 12월 25일까지 편지를 남길 수 있어요. 2027년 1월 1일에 열려요.",
    );
  });

  it("KST 로 날짜가 넘어간 시각은 다음 날로 적는다", () => {
    const period: CapsulePeriod = {
      writeUntil: new Date("2026-12-31T15:00:00.000Z"),
      openAt: new Date("2027-12-31T14:59:59.999Z"),
    };

    expect(buildCapsuleDescription(period)).toBe(
      "2027년 1월 1일까지 편지를 남길 수 있어요. 2027년 12월 31일에 열려요.",
    );
  });

  it("월·일에 0 을 채우지 않는다", () => {
    const period: CapsulePeriod = {
      writeUntil: new Date("2027-01-05T00:00:00.000Z"),
      openAt: new Date("2027-02-09T00:00:00.000Z"),
    };

    expect(buildCapsuleDescription(period)).toBe(
      "2027년 1월 5일까지 편지를 남길 수 있어요. 2027년 2월 9일에 열려요.",
    );
  });

  it("인자를 변형하지 않는다", () => {
    const period: CapsulePeriod = {
      writeUntil: new Date(PERIOD.writeUntil),
      openAt: new Date(PERIOD.openAt),
    };

    buildCapsuleDescription(period);

    expect(period.writeUntil.getTime()).toBe(PERIOD.writeUntil.getTime());
    expect(period.openAt.getTime()).toBe(PERIOD.openAt.getTime());
  });
});
