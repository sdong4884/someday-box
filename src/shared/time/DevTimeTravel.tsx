"use client";

import { refreshNow } from "@/shared/time/nowStore";
import {
  DAY_MS,
  OFFSET_STEPS,
  clearOffset,
  isTimeTravelEnabled,
  writeOffset,
} from "@/shared/time/offset";
import { useDevTimeOffset, useNow } from "@/shared/time/useNow";

const KST_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

const BUTTON_CLASS =
  "rounded-md bg-zinc-700 px-2 py-1 transition-colors hover:bg-zinc-600 active:bg-zinc-500";

/**
 * 오프셋만 민다. 서버와 Supabase RPC 는 진짜 now() 를 쓰므로 만료를 넘겨도 편지 원문이
 * 열리지는 않는다 — 화면 전환과 D-day 표시 확인용이다.
 */
export function DevTimeTravel() {
  const now = useNow();
  const offset = useDevTimeOffset();

  if (!isTimeTravelEnabled() || !now) return null;

  const shift = (ms: number) => {
    writeOffset(offset + ms);
    refreshNow();
  };

  const reset = () => {
    clearOffset();
    refreshNow();
  };

  const offsetDays = Math.round(offset / DAY_MS);

  return (
    <div
      aria-label="개발용 시간 이동"
      className="fixed right-3 bottom-3 z-50 flex flex-col gap-1.5 rounded-xl bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur"
    >
      <div className="flex items-center gap-2 tabular-nums">
        <span>{KST_FORMAT.format(now)}</span>
        {offset !== 0 && (
          <span className="text-amber-400">
            {offsetDays >= 0 ? "+" : ""}
            {offsetDays}일
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {OFFSET_STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => shift(step.ms)}
            className={BUTTON_CLASS}
          >
            {step.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          disabled={offset === 0}
          className={`${BUTTON_CLASS} disabled:opacity-40 disabled:hover:bg-zinc-700`}
        >
          리셋
        </button>
      </div>
    </div>
  );
}
