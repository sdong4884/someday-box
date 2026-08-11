import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * 값이 빈 채로 배포되면 런타임에 영문 모를 401 을 보게 된다. 모듈 로드 시점에 깬다.
 * NEXT_PUBLIC_ 접두사가 붙은 값은 빌드 타임에 인라인되므로 각각 온전한 식으로 적어야 한다.
 */
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
 * 서버 컴포넌트와 클라이언트 컴포넌트가 함께 쓰는 단일 인스턴스.
 *
 * - `@supabase/ssr` 을 쓰지 않는다. 그 패키지는 로그인 세션을 쿠키로 서버·클라이언트가
 *   주고받게 해주는 것인데 이 서비스는 로그인이 없다(docs/decisions.md §4).
 *   동기화할 세션이 없으니 의존성만 늘어난다.
 * - 그래서 요청 간 섞일 상태도 없다. anon 키는 이미 공개되는 값이고 세션을 저장하지
 *   않으므로 서버에서 인스턴스를 공유해도 사용자별 데이터가 남지 않는다.
 * - 서버에서도 필요하다. 캡슐마다 OG 태그가 달라야 해서(docs/decisions.md §1)
 *   generateMetadata 안에서 캡슐을 읽어야 한다.
 *
 * 조회할 때 select('*') 는 쓰지 않는다 — 컬럼 단위 GRANT 때문에 42501 로 실패한다
 * (docs/decisions.md §7). @/lib/dbColumns 의 상수를 쓸 것.
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // 로그인하지 않으므로 토큰을 저장하거나 갱신할 일이 없다.
    // 브라우저 localStorage 도 건드리지 않는다.
    persistSession: false,
    autoRefreshToken: false,
  },
});
