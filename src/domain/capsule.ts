import {
  addKstDays,
  diffKstDays,
  kstDateStringToUtc,
  type KstDateString,
  toKstDateString,
} from "@/domain/kstDate";

export type CapsuleStatus = "WRITING" | "LOCKED" | "OPENED";

export type CapsulePeriod = {
  /** 고른 날짜의 **다음날** 00:00 이다 (이슈 #20). openAt 은 고른 날짜 00:00 그대로다. */
  writeUntil: Date;
  openAt: Date;
};

/**
 * 경계 시각은 다음 상태에 속한다 — DB 가 `>=` 로 막고 열기 때문이다 (편지 공개 RLS 는
 * `now() >= c.open_at`, 작성 RPC 는 `now() >= v_write_until` 이면 SB003). 부등호가
 * 어긋나면 "입력 가능하다고 보여줬는데 저장은 거부" 가 된다.
 */
export function getCapsuleStatus(
  period: CapsulePeriod,
  now: Date,
): CapsuleStatus {
  const nowMs = now.getTime();

  if (nowMs < period.writeUntil.getTime()) return "WRITING";
  if (nowMs < period.openAt.getTime()) return "LOCKED";
  return "OPENED";
}

/** 고른 날짜 00:00 으로 저장하면 고른 날 하루를 통째로 못 쓴다 (이슈 #20). */
export function writeUntilFromKstDate(date: KstDateString): Date {
  return kstDateStringToUtc(addKstDays(date, 1));
}

export function writeUntilDisplayDate(writeUntil: Date): Date {
  return kstDateStringToUtc(addKstDays(toKstDateString(writeUntil), -1));
}

/** writeUntil 을 그대로 빼면 마감일 당일에 D-1 이 뜬다 (이슈 #20). */
export function getWriteDaysLeft(period: CapsulePeriod, now: Date): number {
  return diffKstDays(now, writeUntilDisplayDate(period.writeUntil));
}

export function getOpenDaysLeft(period: CapsulePeriod, now: Date): number {
  return diffKstDays(now, period.openAt);
}
