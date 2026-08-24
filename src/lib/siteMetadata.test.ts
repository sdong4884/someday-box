import { describe, expect, it } from "vitest";

import { resolveSiteUrl } from "@/lib/siteMetadata";

describe("resolveSiteUrl", () => {
  it("SITE_URL 이 있으면 그 값을 그대로 쓴다", () => {
    const url = resolveSiteUrl({ SITE_URL: "https://someday.example" });

    expect(url.href).toBe("https://someday.example/");
  });

  it("SITE_URL 이 다른 후보보다 우선한다", () => {
    const url = resolveSiteUrl({
      SITE_URL: "https://someday.example",
      VERCEL_ENV: "preview",
      VERCEL_BRANCH_URL: "branch.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });

    expect(url.origin).toBe("https://someday.example");
  });

  it("SITE_URL 이 URL 형식이 아니면 안내와 함께 깬다", () => {
    expect(() => resolveSiteUrl({ SITE_URL: "someday.example" })).toThrow(
      /SITE_URL/,
    );
  });

  it("프리뷰에서는 배포마다 바뀌지 않는 VERCEL_BRANCH_URL 을 쓴다", () => {
    const url = resolveSiteUrl({
      VERCEL_ENV: "preview",
      VERCEL_BRANCH_URL: "branch.vercel.app",
      VERCEL_URL: "deploy-abc123.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });

    expect(url.origin).toBe("https://branch.vercel.app");
  });

  it.each(["production", "development"])(
    "VERCEL_ENV 가 %s 면 VERCEL_BRANCH_URL 을 무시한다",
    (vercelEnv) => {
      const url = resolveSiteUrl({
        VERCEL_ENV: vercelEnv,
        VERCEL_BRANCH_URL: "branch.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
      });

      expect(url.origin).toBe("https://prod.vercel.app");
    },
  );

  it("VERCEL_ENV 가 없어도 VERCEL_BRANCH_URL 을 무시한다", () => {
    const url = resolveSiteUrl({
      VERCEL_BRANCH_URL: "branch.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });

    expect(url.origin).toBe("https://prod.vercel.app");
  });

  it("프리뷰라도 VERCEL_BRANCH_URL 이 없으면 프로덕션 도메인으로 내려간다", () => {
    const url = resolveSiteUrl({
      VERCEL_ENV: "preview",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });

    expect(url.origin).toBe("https://prod.vercel.app");
  });

  it("Vercel 변수가 없으면 localhost 로 떨어진다", () => {
    const url = resolveSiteUrl({});

    expect(url.origin).toBe("http://localhost:3000");
  });

  it("PORT 를 반영한다", () => {
    const url = resolveSiteUrl({ PORT: "4000" });

    expect(url.origin).toBe("http://localhost:4000");
  });

  it("빈 문자열 SITE_URL 은 없는 것으로 본다", () => {
    const url = resolveSiteUrl({
      SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
    });

    expect(url.origin).toBe("https://prod.vercel.app");
  });
});
