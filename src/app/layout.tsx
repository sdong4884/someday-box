import type { Metadata, Viewport } from "next";

import {
  OG_DEFAULTS,
  resolveSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/siteMetadata";
import { Toaster } from "@/shared/toast/Toaster";
import { DevTimeTravel } from "@/shared/time/DevTimeTravel";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  // 상대경로로 적은 og:image·og:url 은 이 값을 붙여 절대 URL 이 된다.
  metadataBase: resolveSiteUrl(process.env),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // og:title·og:description 은 Next 가 위 title·description 에서 채운다.
  openGraph: { ...OG_DEFAULTS, url: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased">
      {/* 카카오톡 인앱 브라우저 대응: 100vh 대신 dvh */}
      <body className="flex min-h-dvh flex-col">
        <Providers>
          {children}
          <Toaster />
          {/*
            프로덕션 빌드에서는 이 비교가 false 로 접혀 위젯이 RSC 페이로드에 아예
            들어가지 않는다. 위젯 코드 자체는 공유 청크에 남지만 offset.ts 의 가드도
            상수 false 로 접혀 렌더되더라도 즉시 null 이다.
          */}
          {process.env.NODE_ENV !== "production" && <DevTimeTravel />}
        </Providers>
      </body>
    </html>
  );
}
