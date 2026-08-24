import {
  addKstDays,
  diffKstDays,
  kstDateStringToUtc,
  type KstDateString,
  toKstDateString,
} from "@/domain/kstDate";

/** 캡슐의 세 가지 상태 (CLAUDE.md 핵심 규칙 1). */
export type CapsuleStatus = "WRITING" | "LOCKED" | "OPENED";

export type CapsulePeriod = {
  /** 입력 마감 시각. 이 시각부터는 편지를 쓸 수 없다. 고른 날짜의 **다음날** 00:00 이다. */
  writeUntil: Date;
  /** 만료(공개) 시각. 이 시각부터 편지가 보인다. */
  openAt: Date;
};

/**
 * 캡슐 상태를 판정하는 유일한 지점.
 *
 * 시각은 반드시 인자로 주입한다(docs/decisions.md §3). 내부에서 `new Date()` 를
 * 부르면 몇 달 뒤 상태를 테스트할 수 없다.
 *
 * 경계 시각은 **다음 상태에 속한다** — `writeUntil` 정각은 LOCKED,
 * `openAt` 정각은 OPENED. DB 가 `>=` 기준으로 막고 열기 때문이다:
 * 편지 공개 RLS 는 `now() >= c.open_at`
 * (supabase/migrations/20260810031121_init_capsule_schema.sql),
 * 편지 작성·수정 RPC 는 `now() >= v_write_until` 이면 SB003 으로 거부한다
 * (supabase/migrations/20260811005629_letter_write_rpc.sql).
 * 여기서 어긋나면 "입력 가능하다고 보여줬는데 저장은 거부" 가 된다.
 *
 * `writeUntil <= openAt` 순서는 capsules_period_order CHECK 제약이 보장하므로
 * 따로 검증하지 않는다. 둘이 같으면 LOCKED 없이 WRITING 에서 OPENED 로 넘어간다.
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

/**
 * 고른 날짜 → 저장할 `writeUntil`.
 *
 * 고른 날짜가 **끝날 때까지** 쓸 수 있어야 하므로 다음날 KST 00:00 으로 잠근다.
 * 그 날짜 00:00 으로 저장하면 고른 날 하루를 통째로 못 쓴다 (이슈 #20).
 */
export function writeUntilFromKstDate(date: KstDateString): Date {
  return kstDateStringToUtc(addKstDays(date, 1));
}

/**
 * 저장된 `writeUntil` → 화면에 보여줄 작성 마감일.
 *
 * `writeUntilFromKstDate` 의 역이다. 저장은 다음날 00:00 이지만 사용자가 고른 날짜는
 * 그 전날이므로, 표시할 때 되돌린다.
 */
export function writeUntilDisplayDate(writeUntil: Date): Date {
  return kstDateStringToUtc(addKstDays(toKstDateString(writeUntil), -1));
}

/**
 * 작성 마감일까지 남은 날수. 마감일 당일이면 0.
 *
 * 기준은 저장된 `writeUntil` 이 아니라 사용자가 **고른 날짜**다. `writeUntil` 은 그
 * 다음날 00:00 이라(이슈 #20) 그대로 빼면 하루가 더 나온다 — 마감일 당일에 D-1 이 뜬다.
 * 그래서 `writeUntilDisplayDate` 로 되돌린 뒤 센다.
 *
 * WRITING 인 동안에는 항상 0 이상이다. `now < writeUntil` 이면 `now` 의 KST 날짜가
 * 마감일을 넘을 수 없기 때문이다.
 */
export function getWriteDaysLeft(period: CapsulePeriod, now: Date): number {
  return diffKstDays(now, writeUntilDisplayDate(period.writeUntil));
}
