"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { isRetriableError } from "@/lib/rpcError";
import { NowProvider } from "@/shared/time/NowProvider";

/**
 * 클라이언트 프로바이더 묶음.
 *
 * QueryClient 를 모듈 스코프에 두면 서버에서 요청끼리 캐시를 공유하게 된다.
 * useState 초기화로 렌더 트리마다 하나씩 만든다.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 캡슐 제목·기간은 거의 변하지 않고 편지 수는 몇 초 늦어도 된다.
            // 기본값 0 이면 카카오톡 인앱의 잦은 화면 복귀마다 왕복이 생긴다.
            staleTime: 60_000,

            // 인앱 브라우저는 포커스 이벤트가 수시로 튄다.
            // 갱신은 뮤테이션 후 명시적 invalidateQueries 로 한다.
            refetchOnWindowFocus: false,

            // 서버가 답을 준 에러는 다시 물어도 답이 같다 (SB001~SB005, 42501, PGRST*).
            // 재시도가 뜻이 있는 건 응답 자체가 없을 때뿐이다.
            retry: (failureCount, error) =>
              failureCount < 2 && isRetriableError(error),
          },
          mutations: {
            // 편지 작성에서 재시도는 곧 중복 시도다. SB004 로 막히긴 하지만 보내지 않는다.
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NowProvider>{children}</NowProvider>
    </QueryClientProvider>
  );
}
