"use client";

import { createContext, useSyncExternalStore, type ReactNode } from "react";

import {
  getNowSnapshot,
  getServerNowSnapshot,
  subscribeNow,
  type NowSnapshot,
} from "@/shared/time/nowStore";

/**
 * `undefined` = Provider 밖, `null` = 아직 마운트 전.
 * 둘을 구분해야 useNow() 가 전자만 에러로 던질 수 있다.
 */
export const NowContext = createContext<NowSnapshot | null | undefined>(
  undefined,
);

/**
 * 현재 시각을 앱 전체에 공급한다. 시각을 만드는 지점은 이 스토어 하나뿐이다
 * (docs/decisions.md §3, CLAUDE.md 핵심 규칙 2).
 *
 * 하이드레이션 불일치는 마운트 게이트로 막는다 — 서버 스냅샷이 `null` 이라
 * 서버 HTML 과 클라이언트의 첫 렌더가 완전히 같고, 실제 시각은 하이드레이션이 끝난 뒤에
 * 채워진다. 자세한 근거는 nowStore.ts 참고.
 *
 * 구독은 여기 한 번만 걸고 자식은 Context 로 읽는다.
 */
export function NowProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeNow,
    getNowSnapshot,
    getServerNowSnapshot,
  );

  return <NowContext.Provider value={snapshot}>{children}</NowContext.Provider>;
}
