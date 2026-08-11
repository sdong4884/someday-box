import type { Metadata, Viewport } from "next";

import { DevTimeTravel } from "@/shared/time/DevTimeTravel";
import { NowProvider } from "@/shared/time/NowProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Someday Box",
  description: "특정 날짜에 열리는 편지를 남기는 타임 캡슐",
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
        <NowProvider>
          {children}
          {/*
            프로덕션 빌드에서는 이 비교가 false 로 접혀 위젯이 RSC 페이로드에 아예
            들어가지 않는다. 위젯 코드 자체는 공유 청크에 남지만 offset.ts 의 가드도
            상수 false 로 접혀 렌더되더라도 즉시 null 이다.
          */}
          {process.env.NODE_ENV !== "production" && <DevTimeTravel />}
        </NowProvider>
      </body>
    </html>
  );
}
