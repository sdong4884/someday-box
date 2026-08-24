import { z } from "zod";

import { type CapsulePeriod, writeUntilFromKstDate } from "@/domain/capsule";
import {
  addKstYears,
  isKstDateString,
  kstDateStringToUtc,
  toKstDateString,
} from "@/domain/kstDate";

/**
 * 캡슐 생성 폼의 검증 규칙 (docs/decisions.md §6).
 *
 * zod 는 domain/ 에 두지 않는다 — 날짜 계산 자체는 순수 함수라 domain/kstDate.ts 에
 * 있고, 여기는 그 계산 위에 "폼 필드 이름"과 "사용자에게 보일 문구"를 얹는 UI 계층이다.
 *
 * 문구의 용어는 화면 라벨을 따른다 — `작성 마감일`, `공개일`. DB·마이그레이션 주석에는
 * `입력 마감일`, `만료일` 이 남아 있지만 그건 내부 용어고 사용자에게 보이지 않는다
 * (docs/decisions.md §6).
 *
 * DB 제약과의 관계:
 * - 기간 규칙은 capsules_period_order / capsules_open_at_max 의 앞단 방어다. 최종
 *   판정은 언제나 DB 가 한다.
 * - title 은 DB CHECK 가 1~60자지만 여기서는 20자로 더 좁게 받는다. 모바일 한 줄
 *   제목이라 20자면 충분하고, 클라이언트가 더 엄격한 쪽은 거부만 늘 뿐 DB 가 막을 값을
 *   통과시키지 않는다.
 */

export const CAPSULE_TITLE_MAX_LENGTH = 20;
export const CAPSULE_OPEN_AT_MAX_YEARS = 10;

export const CAPSULE_FORM_MESSAGES = {
  titleRequired: "제목을 입력해 주세요.",
  titleTooLong: `제목은 ${CAPSULE_TITLE_MAX_LENGTH}자까지 쓸 수 있어요.`,
  writeUntilFormat: "작성 마감일을 선택해 주세요.",
  openAtFormat: "공개일을 선택해 주세요.",
  writeUntilPast: "작성 마감일은 오늘 이후로 정해 주세요.",
  openAtPast: "공개일은 내일 이후로 정해 주세요.",
  periodOrder: "공개일은 작성 마감일보다 뒤여야 해요.",
  openAtTooFar: `공개일은 ${CAPSULE_OPEN_AT_MAX_YEARS}년 이내로 정해 주세요.`,
} as const;

/**
 * 기준 시각을 주입받아 스키마를 만든다.
 *
 * 스키마를 모듈 상수로 두면 "오늘"이 import 시점에 굳어버린다. 시각은 인자로 받는다는
 * 규칙(docs/decisions.md §3)을 스키마에도 그대로 적용해, `getCapsuleStatus(period, now)`
 * 와 같은 모양으로 만든다. 화면에서는 `useNow()` 가 준 시각을 넘긴다.
 *
 * 날짜 비교는 `Date` 로 바꾸지 않고 'YYYY-MM-DD' 문자열끼리 한다. 0 패딩 고정폭이라
 * 사전순이 곧 시간순이고, 비교 과정에 타임존이 끼어들 여지가 없다.
 */
export function createCapsuleSchema(now: Date) {
  const today = toKstDateString(now);
  const openAtLimit = addKstYears(today, CAPSULE_OPEN_AT_MAX_YEARS);

  return z
    .object({
      // .trim() 은 체크 파이프라인의 일부라 뒤의 min/max 는 트림된 값을 본다.
      // DB 의 char_length(btrim(title)) 와 같은 기준이 된다.
      title: z
        .string()
        .trim()
        .min(1, { error: CAPSULE_FORM_MESSAGES.titleRequired })
        .max(CAPSULE_TITLE_MAX_LENGTH, {
          error: CAPSULE_FORM_MESSAGES.titleTooLong,
        }),
      writeUntil: z.string().refine(isKstDateString, {
        error: CAPSULE_FORM_MESSAGES.writeUntilFormat,
      }),
      openAt: z.string().refine(isKstDateString, {
        error: CAPSULE_FORM_MESSAGES.openAtFormat,
      }),
    })
    .superRefine((values, ctx) => {
      // superRefine 은 필드 검증이 실패해도 실행된다(타입이 어긋날 때만 건너뛴다).
      // 형식이 깨진 값을 그대로 비교하면 'abc' > '2026-08-12' 같은 무의미한 판정이
      // 엉뚱한 문구로 새어 나오므로, 통과한 필드끼리만 비교한다.
      const hasWriteUntil = isKstDateString(values.writeUntil);
      const hasOpenAt = isKstDateString(values.openAt);

      // 오늘을 골라도 된다 — 저장은 내일 00:00 이라 "오늘까지 쓰기" 가 성립한다.
      if (hasWriteUntil && values.writeUntil < today) {
        ctx.addIssue({
          code: "custom",
          path: ["writeUntil"],
          message: CAPSULE_FORM_MESSAGES.writeUntilPast,
        });
      }

      if (hasOpenAt && values.openAt <= today) {
        ctx.addIssue({
          code: "custom",
          path: ["openAt"],
          message: CAPSULE_FORM_MESSAGES.openAtPast,
        });
      }

      if (hasWriteUntil && hasOpenAt && values.writeUntil >= values.openAt) {
        ctx.addIssue({
          code: "custom",
          path: ["openAt"],
          message: CAPSULE_FORM_MESSAGES.periodOrder,
        });
      }

      if (hasOpenAt && values.openAt > openAtLimit) {
        ctx.addIssue({
          code: "custom",
          path: ["openAt"],
          message: CAPSULE_FORM_MESSAGES.openAtTooFar,
        });
      }
    });
}

export type CreateCapsuleSchema = ReturnType<typeof createCapsuleSchema>;

/** 폼이 다루는 값. 날짜는 `<input type="date">` 가 주는 문자열 그대로다. */
export type CreateCapsuleInput = z.infer<CreateCapsuleSchema>;

/**
 * 검증을 통과한 폼 값을 저장·판정에 쓸 시각으로 바꾼다.
 *
 * 폼 상태는 문자열로 두고 변환은 제출 직전 한 번만 한다. 결과는 그대로
 * `getCapsuleStatus(period, now)` 에 넘길 수 있다.
 */
export function toCapsulePeriod(input: CreateCapsuleInput): CapsulePeriod {
  return {
    // 고른 날짜가 끝날 때까지 쓸 수 있어야 해서 다음날 00:00 으로 잠근다.
    writeUntil: writeUntilFromKstDate(input.writeUntil),
    openAt: kstDateStringToUtc(input.openAt),
  };
}
