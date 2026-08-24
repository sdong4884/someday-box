import type { Metadata } from "next";

export const SITE_NAME = "Someday Box";
export const SITE_DESCRIPTION = "특정 날짜에 열리는 편지를 남기는 타임 캡슐";

/**
 * `metadataBase` 로 쓸 절대 URL.
 *
 * og:image 는 metadataBase 가 없어도 Next 가 Vercel 변수로 보정하지만 og:url 은
 * 그런 폴백이 없어 프로덕션에서도 localhost 로 찍힌다. 카카오 서버가 읽는 값이라
 * 여기서 반드시 세워야 한다.
 *
 * NEXT_PUBLIC_ 을 붙이지 않는다 — 메타데이터는 서버에서만 만들고, 접두사가 없어야
 * 빌드 타임 인라인 제약에서 벗어나 env 를 인자로 받는 순수 함수가 된다.
 *
 * VERCEL_* 는 Vercel 이 기본으로 노출하는 시스템 변수라 배포 쪽 설정이 필요 없다.
 * SITE_URL 은 도메인을 사거나 로컬을 터널로 열어 카카오에 물릴 때를 위한 탈출구다.
 */
export function resolveSiteUrl(env: Record<string, string | undefined>): URL {
  if (env.SITE_URL) {
    try {
      return new URL(env.SITE_URL);
    } catch {
      throw new Error(
        `환경변수 SITE_URL 이 URL 형식이 아닙니다: ${env.SITE_URL}. .env.example 을 참고하세요.`,
      );
    }
  }

  // 프리뷰는 배포마다 URL 이 바뀌는 VERCEL_URL 대신 브랜치에 고정된 쪽을 쓴다.
  if (env.VERCEL_ENV === "preview" && env.VERCEL_BRANCH_URL) {
    return new URL(`https://${env.VERCEL_BRANCH_URL}`);
  }

  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  return new URL(`http://localhost:${env.PORT ?? 3000}`);
}

/**
 * openGraph 는 세그먼트끼리 병합되지 않고 통째로 교체된다. 하위 페이지가 openGraph 를
 * 정의하는 순간 layout 의 이미지·사이트명이 사라지므로 거기서 이 상수를 다시 펼친다.
 */
export const OG_DEFAULTS = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website",
  images: [{ url: "/og.png", width: 1200, height: 630 }],
} as const satisfies Metadata["openGraph"];
