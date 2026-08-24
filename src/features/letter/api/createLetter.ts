import type { CreateLetterInput } from "@/features/letter/model/createLetterSchema";
import type { LetterPublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

// letters 에 INSERT 권한이 없다. 이 RPC 가 유일한 작성 경로다.
export async function createLetter(
  input: CreateLetterInput & { slug: string },
): Promise<LetterPublic | undefined> {
  const { data, error } = await supabase.rpc("create_letter", {
    p_slug: input.slug,
    p_nickname: input.nickname,
    p_content: input.content,
    p_password: input.password,
  });

  if (error) throw error;

  return data?.[0];
}
