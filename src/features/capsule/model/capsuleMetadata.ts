import { type CapsulePeriod, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDateShort } from "@/domain/kstDate";

/** 카카오가 미리보기를 오래 캐시한다. 상태 대신 날짜만 적어야 캐시된 뒤에도 맞다. */
export function buildCapsuleDescription(period: CapsulePeriod): string {
  return `${formatKstDateShort(writeUntilDisplayDate(period.writeUntil))}까지 남긴 편지가 ${formatKstDateShort(period.openAt)}에 열려요.`;
}
