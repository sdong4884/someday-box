import { supabase } from "@/lib/supabase";

export async function deleteLetter(input: {
  slug: string;
  nickname: string;
  password: string;
}): Promise<void> {
  const { error } = await supabase.rpc("delete_letter", {
    p_slug: input.slug,
    p_nickname: input.nickname,
    p_password: input.password,
  });

  if (error) throw error;
}
