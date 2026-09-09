import { describe, expect, it } from "vitest";

import { type CapsulePeriod, writeUntilFromKstDate } from "@/domain/capsule";
import { kstDateStringToUtc } from "@/domain/kstDate";
import {
  buildCapsuleDescription,
  buildCapsuleMetadata,
} from "@/features/capsule/model/capsuleMetadata";
import type { CapsulePublic } from "@/lib/dbColumns";

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

/** 조회로 내려오는 행 모양. 메타데이터가 읽는 컬럼만 의미를 갖는다. */
function row(overrides: Partial<CapsulePublic> = {}): CapsulePublic {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    slug: "quiet-lavender-42",
    title: "졸업하는 날에",
    write_until: writeUntilFromKstDate("2026-12-25").toISOString(),
    open_at: kstDateStringToUtc("2027-01-01").toISOString(),
    created_at: kstDateStringToUtc("2026-01-01").toISOString(),
    ...overrides,
  };
}

describe("buildCapsuleMetadata", () => {
  it("검색 색인과 링크 추적을 모두 막는다", () => {
    expect(buildCapsuleMetadata(row()).robots).toEqual({
      index: false,
      follow: false,
    });
  });

  /*
    카카오톡 링크 공유가 주 유입 경로다(docs/decisions.md §1). robots 를 붙이면서
    OG 태그를 흘리면 미리보기가 통째로 빈칸이 된다.
  */
  it("색인을 막아도 카카오가 읽는 OG 태그는 남긴다", () => {
    const og = buildCapsuleMetadata(row()).openGraph;

    expect(og).toMatchObject({
      title: "졸업하는 날에",
      description: "26.12.25까지 남긴 편지가 27.1.1에 열려요.",
      siteName: "Someday Box",
      locale: "ko_KR",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    });
  });

  it("og:url 을 캡슐 주소로 세운다", () => {
    const og = buildCapsuleMetadata(row({ slug: "still-morning-7" })).openGraph;

    expect(og).toMatchObject({ url: "/c/still-morning-7" });
  });

  it("title 과 description 을 OG 와 같은 값으로 맞춘다", () => {
    const meta = buildCapsuleMetadata(row());

    expect(meta.title).toBe("졸업하는 날에");
    expect(meta.description).toBe("26.12.25까지 남긴 편지가 27.1.1에 열려요.");
  });
});
