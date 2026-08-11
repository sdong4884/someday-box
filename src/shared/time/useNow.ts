"use client";

import { useContext } from "react";

import { NowContext } from "@/shared/time/NowProvider";

function useNowSnapshot() {
  const snapshot = useContext(NowContext);

  if (snapshot === undefined) {
    throw new Error("useNow 는 NowProvider 안에서만 쓸 수 있습니다.");
  }

  return snapshot;
}

/**
 * 현재 시각. **마운트 전에는 `null`** 이다 (NowProvider 의 마운트 게이트).
 *
 * 시각에 의존하는 화면은 null 을 분기해 자리표시자를 그린다.
 *
 * ```tsx
 * const now = useNow();
 * if (!now) return <Skeleton />;
 * const status = getCapsuleStatus(period, now);
 * ```
 */
export function useNow(): Date | null {
  return useNowSnapshot()?.now ?? null;
}

/** 적용 중인 개발용 오프셋(ms). DevTimeTravel 전용. 프로덕션에서는 항상 0. */
export function useDevTimeOffset(): number {
  return useNowSnapshot()?.offset ?? 0;
}
