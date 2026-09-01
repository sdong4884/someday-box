/** 0 이하를 한데 묶는다 — 상태 전환 직후의 한 프레임에 `D--1` 이 찍히지 않게. */
export function formatDdayLabel(daysLeft: number): string {
  return daysLeft <= 0 ? "D-DAY" : `D-${daysLeft}`;
}
