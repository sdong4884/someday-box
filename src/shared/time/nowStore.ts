import { readOffset } from "@/shared/time/offset";

export type NowSnapshot = {
  now: Date;
  /** 적용 중인 개발용 오프셋(ms). 프로덕션에서는 항상 0. */
  offset: number;
};

/**
 * 시각을 담아두는 외부 스토어. React 를 모르는 모듈이다.
 *
 * useSyncExternalStore 는 스냅샷의 **참조가 같을 것**을 요구한다. 매번 새 Date 를
 * 만들면 렌더가 무한히 반복되므로 한 번 만든 스냅샷을 캐시하고, refreshNow() 로
 * 명시적으로 교체할 때만 새로 읽는다. 이것이 "마운트 시 한 번만 읽는다" 를 지키는 지점이고,
 * 주기 갱신 타이머가 없는 이유다 — 기간 종료의 진짜 판정은 DB(RLS·RPC)가 한다.
 */
let clientSnapshot: NowSnapshot | null = null;

const listeners = new Set<() => void>();

function read(): NowSnapshot {
  const offset = readOffset();

  return { now: new Date(Date.now() + offset), offset };
}

export function getNowSnapshot(): NowSnapshot {
  clientSnapshot ??= read();

  return clientSnapshot;
}

/**
 * 서버 렌더와 하이드레이션 렌더가 쓰는 스냅샷.
 *
 * 서버에는 localStorage 도 사용자의 시계도 없으므로, 서버와 클라이언트가 **모두 만들 수
 * 있는 유일한 값인 null** 을 첫 렌더 값으로 쓴다. 두 트리가 똑같아져 하이드레이션
 * 불일치가 원천 차단된다. 실제 시각은 하이드레이션이 끝난 뒤 React 가 getNowSnapshot 을
 * 다시 읽으면서 한 번 채워진다.
 */
export function getServerNowSnapshot(): null {
  return null;
}

export function subscribeNow(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** 오프셋을 바꾼 뒤 시각을 다시 읽는다. */
export function refreshNow(): void {
  clientSnapshot = read();

  for (const listener of listeners) listener();
}
