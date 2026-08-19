import type { Metadata } from "next";

import { CreateCapsuleScreen } from "@/features/capsule/ui/CreateCapsuleScreen";

export const metadata: Metadata = {
  title: "새 캡슐 — Someday Box",
  description: "특정 날짜에 열리는 편지함을 만듭니다.",
};

export default function NewCapsulePage() {
  return (
    <main className="flex flex-1 flex-col">
      <CreateCapsuleScreen />
    </main>
  );
}
