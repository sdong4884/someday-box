import type { Metadata } from "next";

import { type CapsulePeriod, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDateShort } from "@/domain/kstDate";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import type { CapsulePublic } from "@/lib/dbColumns";
import { NOINDEX_ROBOTS, OG_DEFAULTS } from "@/lib/siteMetadata";

/** 카카오가 미리보기를 오래 캐시한다. 상태 대신 날짜만 적어야 캐시된 뒤에도 맞다. */
export function buildCapsuleDescription(period: CapsulePeriod): string {
  return `${formatKstDateShort(writeUntilDisplayDate(period.writeUntil))}까지 남긴 편지가 ${formatKstDateShort(period.openAt)}에 열려요.`;
}

/** robots 는 검색 크롤러만 읽는다. 카카오 미리보기가 쓰는 openGraph 와는 무관하다. */
export function buildCapsuleMetadata(capsule: CapsulePublic): Metadata {
  const description = buildCapsuleDescription(getCapsulePeriod(capsule));

  return {
    title: capsule.title,
    description,
    robots: NOINDEX_ROBOTS,
    openGraph: {
      ...OG_DEFAULTS,
      title: capsule.title,
      description,
      url: `/c/${capsule.slug}`,
    },
  };
}
