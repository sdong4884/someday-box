import { supabase } from "@/lib/supabase";

/**
 * 캡슐의 참여 현황. **본문은 없다.**
 *
 * `get_capsule_summary` 는 편지 개수와 닉네임만 반환한다 — 만료 전 열람 차단을
 * 뚫지 않으려고 security definer 함수에서 `content` 를 아예 빼 두었다
 * (supabase/migrations/20260810031121_init_capsule_schema.sql).
 */
export type CapsuleSummaryData = {
  letterCount: number;
  nicknames: string[];
};

/**
 * 참여 현황을 읽는다. 잠긴 캡슐에서도 호출할 수 있다.
 *
 * `letters` 에는 만료 전 SELECT 를 막는 RLS 정책이 걸려 있어 테이블을 직접 셀 수 없다.
 * 그래서 개수와 닉네임만 돌려주는 RPC 로만 연다.
 *
 * 반환은 0행 또는 1행이다. slug 가 없으면 0행인데, 페이지가 이미 그 경우를 404 로
 * 처리하므로 여기서는 빈 값으로 접는다.
 *
 * 에러는 감싸지 않고 그대로 던진다 — `isRetriableError` 가 code 를 보고 재시도 여부를
 * 판단한다 (createCapsule 과 같은 이유).
 */
export async function getCapsuleSummary(
  slug: string,
): Promise<CapsuleSummaryData> {
  const { data, error } = await supabase.rpc("get_capsule_summary", {
    p_slug: slug,
  });

  if (error) throw error;

  const row = data?.[0];

  return {
    letterCount: row?.letter_count ?? 0,
    nicknames: row?.nicknames ?? [],
  };
}
