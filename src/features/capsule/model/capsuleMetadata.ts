import { type CapsulePeriod, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";

/**
 * 공유 미리보기에 들어갈 한 줄 설명.
 *
 * 카카오는 미리보기를 오래 캐시하므로 상태(WRITING·LOCKED·OPENED)에 따라 문구를
 * 바꾸지 않는다. 두 날짜를 사실로 적으면 캐시된 뒤에도 계속 맞다.
 */
export function buildCapsuleDescription(period: CapsulePeriod): string {
  return `${formatKstDate(writeUntilDisplayDate(period.writeUntil))}까지 편지를 남길 수 있어요. ${formatKstDate(period.openAt)}에 열려요.`;
}
