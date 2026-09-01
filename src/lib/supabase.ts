import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** NEXT_PUBLIC_ 값은 빌드 타임에 인라인되므로 각각 온전한 식으로 적어야 한다. */
function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`환경변수 ${name} 가 없습니다. .env.example 을 참고하세요.`);

  return value;
}

const url = required(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL",
);

const anonKey = required(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);

/**
 * 서버·클라이언트가 함께 쓰는 단일 인스턴스. 로그인이 없어(docs/decisions.md §4)
 * 요청 간 섞일 세션 상태가 없으므로 공유해도 사용자별 데이터가 남지 않는다.
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
