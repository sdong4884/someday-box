import { z } from "zod";

import { type CapsulePeriod, writeUntilFromKstDate } from "@/domain/capsule";
import {
  addKstYears,
  isKstDateString,
  kstDateStringToUtc,
  toKstDateString,
} from "@/domain/kstDate";

/**
 * DB 제약(capsules_period_order / capsules_open_at_max)의 앞단 방어다. 최종 판정은 DB 가
 * 한다. title 은 DB CHECK 가 1~60자지만 여기서 20자로 더 좁게 받는다.
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
 * 스키마를 모듈 상수로 두면 "오늘"이 import 시점에 굳는다. 그래서 팩토리다.
 *
 * 날짜 비교는 'YYYY-MM-DD' 문자열끼리 한다 — 0 패딩 고정폭이라 사전순이 곧 시간순이고
 * 타임존이 끼어들 여지가 없다.
 */
export function createCapsuleSchema(now: Date) {
  const today = toKstDateString(now);
  const openAtLimit = addKstYears(today, CAPSULE_OPEN_AT_MAX_YEARS);

  return z
    .object({
      // 뒤의 min/max 가 트림된 값을 봐야 DB 의 char_length(btrim(title)) 와 기준이 같다.
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
      // superRefine 은 필드 검증이 실패해도 실행된다. 형식이 깨진 값을 비교하면
      // 'abc' > '2026-08-12' 같은 판정이 엉뚱한 문구로 새어 나온다.
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

/** 날짜는 `<input type="date">` 가 주는 문자열 그대로다. */
export type CreateCapsuleInput = z.infer<CreateCapsuleSchema>;

export function toCapsulePeriod(input: CreateCapsuleInput): CapsulePeriod {
  return {
    writeUntil: writeUntilFromKstDate(input.writeUntil),
    openAt: kstDateStringToUtc(input.openAt),
  };
}
