import {
  toCapsulePeriod,
  type CreateCapsuleInput,
} from "@/features/capsule/model/createCapsuleSchema";
import { supabase } from "@/lib/supabase";

/**
 * capsules 에는 INSERT 권한이 없다. 생성 경로는 이 RPC 하나뿐이고 slug 는 DB DEFAULT 가
 * 만든다 (docs/decisions.md §8).
 */
export async function createCapsule(input: CreateCapsuleInput): Promise<string> {
  const { writeUntil, openAt } = toCapsulePeriod(input);

  const { data, error } = await supabase.rpc("create_capsule", {
    p_title: input.title,
    p_write_until: writeUntil.toISOString(),
    p_open_at: openAt.toISOString(),
  });

  // 감싸지 않고 던진다. 호출부가 code 로 어느 칸의 문제인지, 재시도할지를 가른다.
  if (error) throw error;

  return data;
}
