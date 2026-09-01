"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { isRetriableError } from "@/lib/rpcError";
import { NowProvider } from "@/shared/time/NowProvider";

/** QueryClient 를 모듈 스코프에 두면 서버에서 요청끼리 캐시를 공유한다. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본값 0 이면 카카오톡 인앱의 잦은 화면 복귀마다 왕복이 생긴다.
            staleTime: 60_000,

            // 인앱 브라우저는 포커스 이벤트가 수시로 튄다.
            refetchOnWindowFocus: false,

            retry: (failureCount, error) =>
              failureCount < 2 && isRetriableError(error),
          },
          mutations: {
            // 재시도는 곧 중복 생성이다. 캡슐은 막을 장치가 없다.
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
