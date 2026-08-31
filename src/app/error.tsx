"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { FALLBACK_ERROR_MESSAGE } from "@/lib/rpcError";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  // reset() 만으로는 서버 요청이 나가지 않는다. 조회를 다시 태우는 건 refresh() 다.
  // 트랜지션으로 묶어야 재조회가 끝날 때까지 isRetrying 이 서 있다.
  const retry = () => {
    startRetry(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <main className="flex flex-1 flex-col px-5 pt-[100px] pb-7">
      <div className="flex-1">
        <h1 className="text-4xl font-bold tracking-[-0.01em] text-ink">
          화면을 불러오지 못했어요
        </h1>
        <p className="mt-3.5 text-sm leading-[1.6] font-medium text-ink-muted">
          {FALLBACK_ERROR_MESSAGE}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={retry}
          disabled={isRetrying}
          className="flex h-cta w-full items-center justify-center rounded-button bg-accent text-base font-semibold text-bg disabled:opacity-40"
        >
          {isRetrying ? "다시 시도 중" : "다시 시도"}
        </button>

        <Link
          href="/"
          className="flex h-cta w-full items-center justify-center rounded-button bg-surface-muted text-base font-semibold text-ink-muted"
        >
          메인으로
        </Link>
      </div>
    </main>
  );
}
