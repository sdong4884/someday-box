import { type CapsulePeriod, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDateShort } from "@/domain/kstDate";

/**
 * 공유 미리보기에 들어갈 한 줄 설명.
 *
 * 카카오는 미리보기를 오래 캐시하므로 상태(WRITING·LOCKED·OPENED)에 따라 문구를
 * 바꾸지 않는다. 두 날짜를 사실로 적으면 캐시된 뒤에도 계속 맞다.
 *
 * 길면 카카오가 뒤를 자른다. 날짜를 짧은 표기로 쓰는 이유다.
 */
export function buildCapsuleDescription(period: CapsulePeriod): string {
  return `${formatKstDateShort(writeUntilDisplayDate(period.writeUntil))}까지 남긴 편지가 ${formatKstDateShort(period.openAt)}에 열려요.`;
}
