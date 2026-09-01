import { supabase } from "@/lib/supabase";

/** **본문은 없다.** 만료 전 열람 차단을 뚫지 않으려고 RPC 가 `content` 를 아예 빼고 준다. */
export type CapsuleSummaryData = {
  letterCount: number;
  nicknames: string[];
};

/**
 * `letters` 는 만료 전 SELECT 를 막는 RLS 때문에 직접 셀 수 없다. 그래서 RPC 로만 연다.
 * 없는 slug 는 0행으로 오는데 페이지가 이미 404 로 처리하므로 빈 값으로 접는다.
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
