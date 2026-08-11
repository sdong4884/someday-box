import { describe, expect, it, vi } from "vitest";

import {
  getNowSnapshot,
  getServerNowSnapshot,
  refreshNow,
  subscribeNow,
} from "@/shared/time/nowStore";

describe("nowStore", () => {
  it("서버 스냅샷은 null 이다 — 첫 렌더를 서버와 클라이언트가 똑같이 만든다", () => {
    expect(getServerNowSnapshot()).toBeNull();
  });

  it("스냅샷 참조를 캐시한다 — useSyncExternalStore 가 무한 렌더에 빠지지 않는다", () => {
    expect(getNowSnapshot()).toBe(getNowSnapshot());
  });

  it("refreshNow 로만 새 시각을 읽는다", () => {
    const before = getNowSnapshot();

    refreshNow();

    expect(getNowSnapshot()).not.toBe(before);
    expect(getNowSnapshot().now.getTime()).toBeGreaterThanOrEqual(
      before.now.getTime(),
    );
  });

  it("window 가 없으면 오프셋은 0 이다", () => {
    refreshNow();

    expect(getNowSnapshot().offset).toBe(0);
  });

  it("구독자에게 알리고, 해지하면 더 부르지 않는다", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNow(listener);

    refreshNow();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    refreshNow();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
