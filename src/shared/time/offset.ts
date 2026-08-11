/**
 * 개발용 시간 이동 오프셋.
 *
 * NowProvider 가 마운트 시각에 더할 밀리초를 localStorage 에 담아둔다.
 * React 를 모르는 모듈이라 node 환경에서 그대로 테스트할 수 있다.
 */

export const DEV_TIME_OFFSET_KEY = "someday-box:dev-time-offset";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 개발 도구라 DST·윤년 정밀도는 필요 없다. KST 는 DST 도 없다. */
export const OFFSET_STEPS = [
  { label: "+1일", ms: DAY_MS },
  { label: "+30일", ms: 30 * DAY_MS },
  { label: "+1년", ms: 365 * DAY_MS },
] as const;

/**
 * 프로덕션에서는 시간 이동이 존재하지 않는다.
 *
 * 레이아웃도 같은 조건으로 위젯을 렌더에서 빼지만, 실제 안전 보장은 이쪽이다.
 * 번들러가 이 비교를 상수 false 로 접어주므로(`function n(){return!1}`) 위젯이 어떤
 * 경로로 살아남더라도 오프셋은 0 이고 저장·삭제는 no-op 이다.
 */
export function isTimeTravelEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** 저장된 문자열을 밀리초로. 해석할 수 없으면 0. */
export function parseOffset(raw: string | null): number {
  if (raw === null || raw.trim() === "") return 0;

  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * 반드시 마운트 이후에만 호출한다. 서버에는 localStorage 가 없고,
 * 첫 렌더에서 읽으면 하이드레이션 불일치가 난다.
 */
export function readOffset(): number {
  if (!isTimeTravelEnabled() || typeof window === "undefined") return 0;

  try {
    return parseOffset(window.localStorage.getItem(DEV_TIME_OFFSET_KEY));
  } catch {
    // 인앱 브라우저의 시크릿 모드 등에서 접근 자체가 throw 할 수 있다.
    return 0;
  }
}

export function writeOffset(ms: number): void {
  if (!isTimeTravelEnabled() || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEV_TIME_OFFSET_KEY, String(ms));
  } catch {
    // 저장하지 못해도 화면은 그대로 동작한다.
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
