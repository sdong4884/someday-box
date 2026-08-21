/**
 * 'YYYY-MM-DD' 문자열과 UTC `Date` 사이의 변환.
 *
 * 날짜를 고르면 그 날짜의 **KST 00:00** 으로 해석하고 UTC 로 저장한다
 * (docs/decisions.md §6). 시간은 따로 고르지 않으므로 변환 규칙은 이 파일 하나로 끝난다.
 *
 * KST 는 UTC+9 고정이고 서머타임이 없다. 오프셋 상수 하나면 되므로 날짜 라이브러리를
 * 들이지 않는다.
 *
 * 인자 없는 `new Date()` 와 `Date.now()` 는 쓰지 않는다 — 현재 시각이 필요한 함수는
 * 반드시 인자로 받는다 (docs/decisions.md §3).
 */

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' 형식의 날짜 문자열. 값 자체가 실재하는 날짜인지는 보장하지 않는다. */
export type KstDateString = string;

const KST_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateParts = { year: number; month: number; day: number };

/**
 * 형식과 실재 여부를 함께 본다.
 *
 * 정규식만으로는 `2026-02-30` 이나 `2026-13-01` 이 통과하므로 `Date.UTC` 로 만든 뒤
 * 연·월·일이 그대로 돌아오는지 확인한다. `Date.UTC(99, ...)` 가 1999년이 되는 두 자리
 * 연도 해석도 이 왕복 검사에서 걸린다.
 */
function parseParts(value: string): DateParts | null {
  if (!KST_DATE_PATTERN.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

function format({ year, month, day }: DateParts): KstDateString {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function toKstParts(date: Date): DateParts {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** 해당 연·월의 마지막 날. 다음 달 0일 = 이번 달 말일. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isKstDateString(value: string): value is KstDateString {
  return parseParts(value) !== null;
}

/**
 * 'YYYY-MM-DD' → 그 날짜 KST 00:00 의 UTC 시각.
 *
 * `'2027-01-01'` → `2026-12-31T15:00:00.000Z`
 *
 * @throws RangeError 형식이 아니거나 실재하지 않는 날짜일 때. 폼 입력은
 * `createCapsuleSchema` 가 먼저 거르므로, 여기까지 잘못된 값이 오면 버그다.
 */
export function kstDateStringToUtc(value: string): Date {
  const parts = parseParts(value);

  if (parts === null) {
    throw new RangeError(`'YYYY-MM-DD' 형식의 날짜가 아닙니다: ${value}`);
  }

  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day) - KST_OFFSET_MS,
  );
}

/**
 * UTC 시각 → 그 시각이 KST 에서 속하는 날짜.
 *
 * `2026-12-31T15:00:00Z` 는 KST 로 이미 1월 1일이므로 `'2027-01-01'` 이다.
 */
export function toKstDateString(date: Date): KstDateString {
  return format(toKstParts(date));
}

/** `now` 가 속한 KST 날짜의 00:00. 그날의 시작 시각이 필요할 때 쓴다. */
export function startOfKstDay(now: Date): Date {
  return kstDateStringToUtc(toKstDateString(now));
}

/**
 * 날짜에 연 단위로 더한다. 없는 날짜가 되면 그 달의 말일로 당긴다.
 *
 * Postgres 의 `+ interval '10 years'` 와 결과를 맞추기 위한 클램프다. Postgres 는
 * `2028-02-29 + 10년` 을 `2038-02-28` 로 접지만 `Date.UTC(2038, 1, 29)` 는
 * `2038-03-01` 로 넘어간다. 그대로 두면 클라이언트가 통과시킨 만료일을
 * capsules_open_at_max 제약이 거부하는 날이 4년에 한 번 생긴다.
 *
 * @throws RangeError `kstDateStringToUtc` 와 같은 조건.
 */
export function addKstYears(value: string, years: number): KstDateString {
  const parts = parseParts(value);

  if (parts === null) {
    throw new RangeError(`'YYYY-MM-DD' 형식의 날짜가 아닙니다: ${value}`);
  }

  const year = parts.year + years;

  return format({
    year,
    month: parts.month,
    day: Math.min(parts.day, lastDayOfMonth(year, parts.month)),
  });
}

/**
 * 날짜에 일 단위로 더한다.
 *
 * 달·해를 넘기는 계산은 `Date.UTC` 의 넘침 처리에 맡긴다 — `Date.UTC(2026, 0, 32)` 는
 * 2026-02-01 이 되므로 월말·연말·윤년을 따로 다룰 필요가 없다. `addKstYears` 와 달리
 * 클램프가 없는 이유이기도 하다. 없는 날짜가 나올 수 없다.
 *
 * 폼에서 "작성 마감일 다음날"처럼 고를 수 있는 날짜의 하한을 만들 때 쓴다.
 *
 * @throws RangeError `kstDateStringToUtc` 와 같은 조건.
 */
export function addKstDays(value: string, days: number): KstDateString {
  const parts = parseParts(value);

  if (parts === null) {
    throw new RangeError(`'YYYY-MM-DD' 형식의 날짜가 아닙니다: ${value}`);
  }

  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

  return format({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
}

/** `2026-12-31T15:00:00Z` → `'2027년 1월 1일'` */
export function formatKstDate(date: Date): string {
  const { year, month, day } = toKstParts(date);

  return `${year}년 ${month}월 ${day}일`;
}
