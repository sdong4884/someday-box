import {
  toCapsulePeriod,
  type CreateCapsuleInput,
} from "@/features/capsule/model/createCapsuleSchema";
import { supabase } from "@/lib/supabase";

/**
 * 캡슐을 만들고 공유용 slug 를 받는다.
 *
 * capsules 에는 INSERT 권한이 없다. 생성 경로는 security definer RPC 하나뿐이고
 * slug 는 DB DEFAULT 가 만든다 (docs/decisions.md §8).
 *
 * 폼 값의 'YYYY-MM-DD' 는 그 날짜 KST 00:00 으로 해석해 UTC 로 보낸다
 * (docs/decisions.md §6). 변환은 toCapsulePeriod 한 곳에서만 한다.
 */
export async function createCapsule(input: CreateCapsuleInput): Promise<string> {
  const { writeUntil, openAt } = toCapsulePeriod(input);

  const { data, error } = await supabase.rpc("create_capsule", {
    p_title: input.title,
    p_write_until: writeUntil.toISOString(),
    p_open_at: openAt.toISOString(),
  });

  // 감싸지 않고 그대로 던진다. 호출부가 code 를 보고 어느 칸의 문제인지 판단하고
  // (toCreateCapsuleFieldError), 재시도 여부도 code 로 갈린다 (isRetriableError).
  if (error) throw error;

  return data;
}
