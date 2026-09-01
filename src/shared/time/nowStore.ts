import { readOffset } from "@/shared/time/offset";

export type NowSnapshot = {
  now: Date;
  /** 개발용 오프셋(ms). 프로덕션에서는 항상 0. */
  offset: number;
};

/**
 * useSyncExternalStore 는 스냅샷의 **참조가 같을 것**을 요구한다. 매번 새 Date 를 만들면
 * 렌더가 무한히 반복되므로 캐시하고 refreshNow() 로만 교체한다.
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

/** 서버·클라이언트가 모두 만들 수 있는 유일한 값이 null 이다. 하이드레이션 불일치를 막는다. */
export function getServerNowSnapshot(): null {
  return null;
}

export function subscribeNow(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function refreshNow(): void {
  clientSnapshot = read();

  for (const listener of listeners) listener();
}
