"use client";

import { getCapsuleStatus } from "@/domain/capsule";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { CapsuleSummary } from "@/features/capsule/ui/capsuleParts";
import { LockedView } from "@/features/capsule/ui/LockedView";
import { OpenedView } from "@/features/capsule/ui/OpenedView";
import { WritingView } from "@/features/capsule/ui/WritingView";
import type { CapsulePublic } from "@/lib/dbColumns";
import { useNow } from "@/shared/time/useNow";

export function CapsuleScreen({ capsule }: { capsule: CapsulePublic }) {
  const now = useNow();

  /** 마운트 전 null. 이 분기를 지우면 서버 HTML 과 어긋난다 (shared/time/nowStore.ts). */
  if (!now) return <CapsuleSummary capsule={capsule} status={null} />;

  const status = getCapsuleStatus(getCapsulePeriod(capsule), now);

  switch (status) {
    case "WRITING":
      // 시각은 여기서 한 번만 읽어 내려보낸다.
      return <WritingView capsule={capsule} now={now} />;
    case "LOCKED":
      return <LockedView capsule={capsule} />;
    case "OPENED":
      return <OpenedView capsule={capsule} />;
  }
}
