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

/** **마운트 전에는 `null`** 이다. 시각에 의존하는 화면은 null 을 분기해야 한다. */
export function useNow(): Date | null {
  return useNowSnapshot()?.now ?? null;
}

/** DevTimeTravel 전용. 프로덕션에서는 항상 0. */
export function useDevTimeOffset(): number {
  return useNowSnapshot()?.offset ?? 0;
}
