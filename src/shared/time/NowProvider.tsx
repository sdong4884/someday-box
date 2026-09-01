"use client";

import { createContext, useSyncExternalStore, type ReactNode } from "react";

import {
  getNowSnapshot,
  getServerNowSnapshot,
  subscribeNow,
  type NowSnapshot,
} from "@/shared/time/nowStore";

/** `undefined` = Provider 밖, `null` = 마운트 전. useNow() 가 전자만 던지려면 갈라야 한다. */
export const NowContext = createContext<NowSnapshot | null | undefined>(
  undefined,
);

export function NowProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeNow,
    getNowSnapshot,
    getServerNowSnapshot,
  );

  return <NowContext.Provider value={snapshot}>{children}</NowContext.Provider>;
}
