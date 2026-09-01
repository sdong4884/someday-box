import { LETTER_PUBLIC_COLUMNS, type LetterPublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

/** 상태를 보지 않는다 — RLS 가 `now() >= open_at` 부터 열어 주므로 공개 전에는 빈 배열이다. */
export async function getCapsuleLetters(
  capsuleId: string,
): Promise<LetterPublic[]> {
  const { data, error } = await supabase
    .from("letters")
    .select(LETTER_PUBLIC_COLUMNS)
    .eq("capsule_id", capsuleId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
