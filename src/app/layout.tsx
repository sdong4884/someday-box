import type { Metadata, Viewport } from "next";
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
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
