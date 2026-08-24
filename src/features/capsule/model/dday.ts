/**
 * 남은 날수를 화면에 찍을 문구로 바꾼다.
 *
 * 계산은 `getWriteDaysLeft` 가 하고 여기는 표기만 맡는다 — 문구는 화면 사정이라
 * domain 에 두지 않는다 (`capsuleMetadata.ts` 와 같은 이유).
 *
 * 0 이하를 한데 묶어 `D-DAY` 로 본다. WRITING 인 동안 음수가 나올 수는 없지만,
 * 상태 전환 직후의 한 프레임 같은 경우에 `D--1` 이 찍히는 것보다는 낫다.
 */
export function formatDdayLabel(daysLeft: number): string {
  return daysLeft <= 0 ? "D-DAY" : `D-${daysLeft}`;
}
