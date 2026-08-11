/** 캡슐의 세 가지 상태 (CLAUDE.md 핵심 규칙 1). */
export type CapsuleStatus = "WRITING" | "LOCKED" | "OPENED";

export type CapsulePeriod = {
  /** 입력 마감 시각. 이 시각부터는 편지를 쓸 수 없다. */
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
 * `writeUntil < openAt` 순서는 capsules_period_order CHECK 제약이 보장하므로
 * 따로 검증하지 않는다.
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
