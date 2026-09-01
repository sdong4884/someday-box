/** 날짜는 KST 00:00 으로 해석해 UTC 로 저장한다 (docs/decisions.md §6). */

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** 형식만 뜻한다. 실재하는 날짜인지는 보장하지 않는다. */
export type KstDateString = string;

const KST_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateParts = { year: number; month: number; day: number };

/** 정규식만으로는 `2026-02-30` 이 통과한다. 그래서 Date.UTC 왕복으로 실재 여부를 본다. */
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

/** 다음 달 0일 = 이번 달 말일. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isKstDateString(value: string): value is KstDateString {
  return parseParts(value) !== null;
}

export function kstDateStringToUtc(value: string): Date {
  const parts = parseParts(value);

  if (parts === null) {
    throw new RangeError(`'YYYY-MM-DD' 형식의 날짜가 아닙니다: ${value}`);
  }

  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day) - KST_OFFSET_MS,
  );
}

export function toKstDateString(date: Date): KstDateString {
  return format(toKstParts(date));
}

export function startOfKstDay(now: Date): Date {
  return kstDateStringToUtc(toKstDateString(now));
}

/**
 * 말일 클램프는 Postgres 의 `+ interval` 과 결과를 맞추기 위한 것이다. 없으면 클라이언트가
 * 통과시킨 만료일을 capsules_open_at_max 제약이 거부하는 날이 4년에 한 번 생긴다.
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

/** Date.UTC 의 넘침 처리에 맡기므로 없는 날짜가 나올 수 없다 — addKstYears 와 달리 클램프가 없다. */
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

/** 시각이 아니라 날짜를 뺀다 — `23:59 → 다음날 00:01` 은 1이다. D-day 가 원하는 셈법이다. */
export function diffKstDays(from: Date, to: Date): number {
  const fromDay = startOfKstDay(from).getTime();
  const toDay = startOfKstDay(to).getTime();

  return Math.round((toDay - fromDay) / DAY_MS);
}

export function formatKstDate(date: Date): string {
  const { year, month, day } = toKstParts(date);

  return `${year}년 ${month}월 ${day}일`;
}

/** 카카오 공유 미리보기가 긴 설명의 뒤를 자른다. 그래서 짧은 표기가 따로 있다. */
export function formatKstDateShort(date: Date): string {
  const { year, month, day } = toKstParts(date);

  return `${pad(year % 100, 2)}.${month}.${day}`;
}
