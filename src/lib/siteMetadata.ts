import type { Metadata } from "next";

export const SITE_NAME = "Someday Box";
export const SITE_DESCRIPTION = "특정 날짜에 열리는 편지를 남기는 타임 캡슐";

/**
 * og:url 은 Next 의 Vercel 폴백이 없어, 세우지 않으면 프로덕션에서도 localhost 로 찍힌다.
 * 카카오 서버가 읽는 값이다.
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

/** openGraph 는 세그먼트끼리 병합되지 않고 통째로 교체된다. 하위 페이지에서 다시 펼칠 것. */
export const OG_DEFAULTS = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website",
  images: [{ url: "/og.png", width: 1200, height: 630 }],
} as const satisfies Metadata["openGraph"];
