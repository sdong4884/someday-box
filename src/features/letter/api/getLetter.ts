import type { LetterPublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

// letters 는 만료 전 SELECT 를 RLS 가 막는다. 작성자 본인의 열람도 이 RPC 가 유일한 경로다.
export async function getLetter(input: {
  slug: string;
  nickname: string;
  password: string;
}): Promise<LetterPublic | undefined> {
  const { data, error } = await supabase.rpc("get_letter", {
    p_slug: input.slug,
    p_nickname: input.nickname,
    p_password: input.password,
  });

  if (error) throw error;

  return data?.[0];
}
