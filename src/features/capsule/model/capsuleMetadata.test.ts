import { describe, expect, it } from "vitest";

import { type CapsulePeriod, writeUntilFromKstDate } from "@/domain/capsule";
import { kstDateStringToUtc } from "@/domain/kstDate";
import { buildCapsuleDescription } from "@/features/capsule/model/capsuleMetadata";

/** 사용자가 폼에서 고른 두 날짜로 저장될 기간을 만든다. */
function pick(writeUntil: string, openAt: string): CapsulePeriod {
  return {
    writeUntil: writeUntilFromKstDate(writeUntil),
    openAt: kstDateStringToUtc(openAt),
  };
}

describe("buildCapsuleDescription", () => {
  it("고른 날짜를 그대로 적는다", () => {
    expect(buildCapsuleDescription(pick("2026-12-25", "2027-01-01"))).toBe(
      "26.12.25까지 남긴 편지가 27.1.1에 열려요.",
    );
  });

  it("월·일에 0 을 채우지 않는다", () => {
    expect(buildCapsuleDescription(pick("2027-01-05", "2027-02-09"))).toBe(
      "27.1.5까지 남긴 편지가 27.2.9에 열려요.",
    );
  });

  it("연말을 넘겨도 고른 날짜가 그대로 나온다", () => {
    expect(buildCapsuleDescription(pick("2026-12-31", "2027-01-01"))).toBe(
      "26.12.31까지 남긴 편지가 27.1.1에 열려요.",
    );
  });

  it("윤년 2월 29일도 그대로 나온다", () => {
    expect(buildCapsuleDescription(pick("2028-02-29", "2028-03-01"))).toBe(
      "28.2.29까지 남긴 편지가 28.3.1에 열려요.",
    );
  });

  /*
    저장값을 직접 넣는 경로. 폼을 거치지 않은 값(마이그레이션 이전 행 등)도 표시는
    같은 규칙으로 하루 앞을 가리킨다.
  */
  it("저장된 writeUntil 의 전날을 적는다", () => {
    const period: CapsulePeriod = {
      writeUntil: kstDateStringToUtc("2026-12-26"),
      openAt: kstDateStringToUtc("2027-01-01"),
    };

    expect(buildCapsuleDescription(period)).toBe(
      "26.12.25까지 남긴 편지가 27.1.1에 열려요.",
    );
  });

  it("인자를 변형하지 않는다", () => {
    const period = pick("2026-12-25", "2027-01-01");
    const before = {
      writeUntil: period.writeUntil.getTime(),
      openAt: period.openAt.getTime(),
    };

    buildCapsuleDescription(period);

    expect(period.writeUntil.getTime()).toBe(before.writeUntil);
    expect(period.openAt.getTime()).toBe(before.openAt);
  });

  /*
    카카오 공유 미리보기는 설명이 길면 뒤를 자른다. 예전 문구가 47자였고 실기기에서
    잘렸다. 다시 길어지면 여기서 걸린다.
  */
  it("카카오가 자르지 않을 길이를 유지한다", () => {
    const longest = buildCapsuleDescription(pick("2026-12-25", "2027-12-31"));

    expect(longest.length).toBeLessThanOrEqual(35);
  });
});
