export const DEV_TIME_OFFSET_KEY = "someday-box:dev-time-offset";

export const DAY_MS = 24 * 60 * 60 * 1000;

export const OFFSET_STEPS = [
  { label: "+1일", ms: DAY_MS },
  { label: "+30일", ms: 30 * DAY_MS },
  { label: "+1년", ms: 365 * DAY_MS },
] as const;

/**
 * 프로덕션 안전 보장은 이 함수다. 번들러가 상수 false 로 접어 주므로, 위젯이 어떤 경로로
 * 살아남더라도 오프셋은 0 이고 저장·삭제는 no-op 이 된다.
 */
export function isTimeTravelEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function parseOffset(raw: string | null): number {
  if (raw === null || raw.trim() === "") return 0;

  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : 0;
}

/** 마운트 이후에만 부른다. 첫 렌더에서 읽으면 하이드레이션 불일치가 난다. */
export function readOffset(): number {
  if (!isTimeTravelEnabled() || typeof window === "undefined") return 0;

  try {
    return parseOffset(window.localStorage.getItem(DEV_TIME_OFFSET_KEY));
  } catch {
    // 인앱 브라우저의 시크릿 모드 등에서는 접근 자체가 throw 한다.
    return 0;
  }
}

export function writeOffset(ms: number): void {
  if (!isTimeTravelEnabled() || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEV_TIME_OFFSET_KEY, String(ms));
  } catch {
    // 개발 도구라 저장에 실패해도 그냥 넘어간다.
  }
}

export function clearOffset(): void {
  if (!isTimeTravelEnabled() || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DEV_TIME_OFFSET_KEY);
  } catch {
    // 위와 같다.
  }
}
