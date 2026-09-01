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
  metadataBase: resolveSiteUrl(process.env),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
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
          {/* 프로덕션 빌드에서는 이 비교가 false 로 접혀 RSC 페이로드에 들어가지 않는다. */}
          {process.env.NODE_ENV !== "production" && <DevTimeTravel />}
        </Providers>
      </body>
    </html>
  );
}
