import { describe, expect, it } from "vitest";

import { getCapsuleStatus } from "@/domain/capsule";
import {
  CAPSULE_FORM_MESSAGES as MESSAGES,
  CAPSULE_TITLE_MAX_LENGTH,
  createCapsuleSchema,
  toCapsulePeriod,
  type CreateCapsuleInput,
} from "@/features/capsule/model/createCapsuleSchema";

/** KST 2026-08-12 14:00. 모든 기대값은 이 "오늘" 에서 파생된다. */
const NOW = new Date("2026-08-12T05:00:00.000Z");

const TODAY = "2026-08-12";
const TOMORROW = "2026-08-13";
const TEN_YEARS_LATER = "2036-08-12";

const schema = createCapsuleSchema(NOW);

const VALID: CreateCapsuleInput = {
  title: "졸업 10주년",
  writeUntil: "2026-09-01",
  openAt: "2026-12-25",
};

/** 한 필드만 바꿔 넣는다. */
const withField = (patch: Partial<CreateCapsuleInput>) => ({
  ...VALID,
  ...patch,
});

/** 해당 필드에 붙은 에러 문구들. 통과했으면 빈 배열. */
function messagesFor(input: unknown, field: keyof CreateCapsuleInput) {
  const result = schema.safeParse(input);

  return (result.error?.issues ?? [])
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe("createCapsuleSchema", () => {
  it("올바른 입력은 통과한다", () => {
    expect(schema.safeParse(VALID)).toMatchObject({
      success: true,
      data: VALID,
    });
  });

  describe("title", () => {
    it("앞뒤 공백을 제거한 값이 결과로 나온다", () => {
      const result = schema.safeParse(withField({ title: "  졸업 10주년  " }));

      expect(result.success && result.data.title).toBe("졸업 10주년");
    });

    it("공백뿐이면 트림 후 빈 값이라 실패한다", () => {
      expect(messagesFor(withField({ title: "   " }), "title")).toEqual([
        MESSAGES.titleRequired,
      ]);
    });

    it("빈 문자열은 실패한다", () => {
      expect(messagesFor(withField({ title: "" }), "title")).toEqual([
        MESSAGES.titleRequired,
      ]);
    });

    it(`${CAPSULE_TITLE_MAX_LENGTH}자는 통과한다`, () => {
      const title = "가".repeat(CAPSULE_TITLE_MAX_LENGTH);

      expect(messagesFor(withField({ title }), "title")).toEqual([]);
    });

    it(`${CAPSULE_TITLE_MAX_LENGTH + 1}자는 실패한다`, () => {
      const title = "가".repeat(CAPSULE_TITLE_MAX_LENGTH + 1);

      expect(messagesFor(withField({ title }), "title")).toEqual([
        MESSAGES.titleTooLong,
      ]);
    });

    // 트림이 max 앞에서 돌지 않으면 공백 때문에 실패했을 값이다.
    it("공백을 포함해 한도를 넘어도 트림 후 기준으로 본다", () => {
      const title = ` ${"가".repeat(CAPSULE_TITLE_MAX_LENGTH)} `;

      expect(messagesFor(withField({ title }), "title")).toEqual([]);
    });
  });

  describe("날짜 형식", () => {
    it.each(["", "2026-9-1", "20260901", "2026-02-30", "내일"])(
      "%s 는 형식 오류다",
      (writeUntil) => {
        expect(messagesFor(withField({ writeUntil }), "writeUntil")).toEqual([
          MESSAGES.writeUntilFormat,
        ]);
      },
    );

    it("형식이 깨진 날짜는 기간 비교 문구를 만들지 않는다", () => {
      const messages = messagesFor(
        withField({ writeUntil: "내일", openAt: "모레" }),
        "openAt",
      );

      expect(messages).toEqual([MESSAGES.openAtFormat]);
    });

    it("문자열이 아니면 타입 오류가 난다", () => {
      const result = schema.safeParse(withField({ openAt: 20261225 as never }));

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe("invalid_type");
    });
  });

  describe("오늘 이후", () => {
    // 저장은 고른 날짜의 다음날 00:00 이라 오늘을 골라도 "오늘까지 쓰기" 가 성립한다.
    it("오늘은 통과한다", () => {
      expect(
        messagesFor(withField({ writeUntil: TODAY }), "writeUntil"),
      ).toEqual([]);
      expect(
        messagesFor(withField({ writeUntil: TODAY, openAt: TOMORROW }), "openAt")
          .length,
      ).toBe(0);
    });

    it("어제는 실패한다", () => {
      expect(
        messagesFor(withField({ writeUntil: "2026-08-11" }), "writeUntil"),
      ).toEqual([MESSAGES.writeUntilPast]);
    });

    it("내일은 통과한다", () => {
      expect(
        messagesFor(withField({ writeUntil: TOMORROW }), "writeUntil"),
      ).toEqual([]);
    });

    it("공개일도 오늘이면 실패한다", () => {
      expect(
        messagesFor(
          withField({ writeUntil: "2026-08-01", openAt: TODAY }),
          "openAt",
        ),
      ).toContain(MESSAGES.openAtPast);
    });
  });

  describe("writeUntil < openAt", () => {
    it("같은 날이면 실패한다", () => {
      expect(
        messagesFor(
          withField({ writeUntil: TOMORROW, openAt: TOMORROW }),
          "openAt",
        ),
      ).toEqual([MESSAGES.periodOrder]);
    });

    it("공개일이 더 앞서면 실패한다", () => {
      expect(
        messagesFor(
          withField({ writeUntil: "2026-12-25", openAt: "2026-09-01" }),
          "openAt",
        ),
      ).toEqual([MESSAGES.periodOrder]);
    });

    it("하루 차이면 통과한다", () => {
      expect(
        messagesFor(
          withField({ writeUntil: TOMORROW, openAt: "2026-08-14" }),
          "openAt",
        ),
      ).toEqual([]);
    });
  });

  describe("공개일 10년 상한", () => {
    it("정확히 10년 뒤는 통과한다", () => {
      expect(
        messagesFor(withField({ openAt: TEN_YEARS_LATER }), "openAt"),
      ).toEqual([]);
    });

    it("10년 하루 뒤는 실패한다", () => {
      expect(
        messagesFor(withField({ openAt: "2036-08-13" }), "openAt"),
      ).toEqual([MESSAGES.openAtTooFar]);
    });
  });

  describe("기준 시각 주입", () => {
    it("같은 입력이라도 오늘이 바뀌면 판정이 뒤집힌다", () => {
      const input = withField({ writeUntil: TODAY, openAt: TOMORROW });
      // 하루 지나면 writeUntil 이 어제가 되어 거부된다.
      const dayLater = createCapsuleSchema(
        new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
      );

      expect(schema.safeParse(input).success).toBe(true);
      expect(dayLater.safeParse(input).success).toBe(false);
    });

    // KST 자정 경계에서 "오늘" 이 넘어가야 한다. 8/12 23:00 KST = 14:00Z.
    it("UTC 15:00 을 넘기면 다음 날 기준으로 검증한다", () => {
      const input = withField({ writeUntil: TODAY, openAt: TOMORROW });

      expect(
        createCapsuleSchema(new Date("2026-08-12T14:00:00.000Z")).safeParse(
          input,
        ).success,
      ).toBe(true);
      expect(
        createCapsuleSchema(new Date("2026-08-12T15:00:00.000Z")).safeParse(
          input,
        ).success,
      ).toBe(false);
    });
  });
});

describe("toCapsulePeriod", () => {
  it("공개일은 고른 날짜 KST 00:00 이다", () => {
    const period = toCapsulePeriod({
      ...VALID,
      writeUntil: "2026-09-01",
      openAt: "2027-01-01",
    });

    expect(period.openAt.toISOString()).toBe("2026-12-31T15:00:00.000Z");
  });

  // 고른 날짜가 끝날 때까지 쓸 수 있어야 하므로 다음날 00:00 에 잠근다 (이슈 #20).
  it("작성 마감일은 고른 날짜의 다음날 KST 00:00 이다", () => {
    const period = toCapsulePeriod({
      ...VALID,
      writeUntil: "2026-09-01",
      openAt: "2027-01-01",
    });

    expect(period.writeUntil.toISOString()).toBe("2026-09-01T15:00:00.000Z");
  });

  it("고른 날짜 마지막 순간까지 WRITING 이다", () => {
    const period = toCapsulePeriod({
      ...VALID,
      writeUntil: "2026-09-01",
      openAt: "2027-01-01",
    });

    // 2026-09-01 23:59:59.999 KST = 2026-09-01T14:59:59.999Z
    expect(
      getCapsuleStatus(period, new Date("2026-09-01T14:59:59.999Z")),
    ).toBe("WRITING");
    expect(getCapsuleStatus(period, new Date("2026-09-01T15:00:00.000Z"))).toBe(
      "LOCKED",
    );
  });

  it("공개일이 작성 마감일 다음날이면 LOCKED 없이 열린다", () => {
    const period = toCapsulePeriod({
      ...VALID,
      writeUntil: "2026-09-01",
      openAt: "2026-09-02",
    });

    expect(period.writeUntil.getTime()).toBe(period.openAt.getTime());
    expect(
      getCapsuleStatus(period, new Date("2026-09-01T14:59:59.999Z")),
    ).toBe("WRITING");
    expect(getCapsuleStatus(period, new Date("2026-09-01T15:00:00.000Z"))).toBe(
      "OPENED",
    );
  });

  it("결과를 그대로 getCapsuleStatus 에 넘길 수 있다", () => {
    const period = toCapsulePeriod(VALID);

    expect(getCapsuleStatus(period, NOW)).toBe("WRITING");
    expect(getCapsuleStatus(period, new Date("2026-11-01T00:00:00Z"))).toBe(
      "LOCKED",
    );
    expect(getCapsuleStatus(period, new Date("2027-01-01T00:00:00Z"))).toBe(
      "OPENED",
    );
  });
});
