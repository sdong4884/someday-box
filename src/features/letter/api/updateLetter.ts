import type { LetterPublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

// letters 에 UPDATE 권한이 없다. 이 RPC 가 유일한 수정 경로다.
export async function updateLetter(input: {
  slug: string;
  nickname: string;
  password: string;
  content: string;
}): Promise<LetterPublic | undefined> {
  const { data, error } = await supabase.rpc("update_letter", {
    p_slug: input.slug,
    p_nickname: input.nickname,
    p_password: input.password,
    p_content: input.content,
  });

  if (error) throw error;

  return data?.[0];
}
