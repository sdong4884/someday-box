import { LETTER_PUBLIC_COLUMNS, type LetterPublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

/**
 * 공개된 캡슐의 편지 전문.
 * 상태를 따로 보지 않는다 — letters_select_after_open 정책이 `now() >= open_at` 부터 행을 열어 주므로, 공개 전에는 빈 배열이 온다.
 */
export async function getCapsuleLetters(
  capsuleId: string,
): Promise<LetterPublic[]> {
  const { data, error } = await supabase
    .from("letters")
    // select('*') 는 컬럼 단위 GRANT 때문에 42501 로 죽는다 (docs/decisions.md §7).
    .select(LETTER_PUBLIC_COLUMNS)
    .eq("capsule_id", capsuleId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
