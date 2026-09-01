import { type CapsulePeriod, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDateShort } from "@/domain/kstDate";

/**
 * 카카오가 미리보기를 오래 캐시하므로 상태에 따라 문구를 바꾸지 않는다 — 날짜만 적으면
 * 캐시된 뒤에도 계속 맞다.
 */
export function buildCapsuleDescription(period: CapsulePeriod): string {
  return `${formatKstDateShort(writeUntilDisplayDate(period.writeUntil))}까지 남긴 편지가 ${formatKstDateShort(period.openAt)}에 열려요.`;
}
