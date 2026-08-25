"use client";

import { getOpenDaysLeft } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";
import { useCapsuleSummary } from "@/features/capsule/api/useCapsuleSummary";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { formatDdayLabel } from "@/features/capsule/model/dday";
import {
  CapsuleHeader,
  CountdownCard,
  LockIcon,
  NicknameList,
} from "@/features/capsule/ui/capsuleParts";
import type { CapsulePublic } from "@/lib/dbColumns";

export function LockedView({
  capsule,
  now,
}: {
  capsule: CapsulePublic;
  now: Date;
}) {
  const period = getCapsulePeriod(capsule);

  return (
    <div className="flex flex-1 flex-col gap-7 px-5 py-6">
      <CapsuleHeader capsule={capsule} />

      <CountdownCard
        icon={<LockIcon className="size-6 text-accent-soft" />}
        label="공개까지"
        dday={formatDdayLabel(getOpenDaysLeft(period, now))}
        caption={`${formatKstDate(period.openAt)} 공개`}
      />

      <LockedParticipation slug={capsule.slug} />
    </div>
  );
}

function LockedParticipation({ slug }: { slug: string }) {
  const { data, isPending, isError } = useCapsuleSummary(slug);

  if (isError) return null;

  if (isPending) {
    return (
      <p aria-hidden="true" className="invisible text-sm">
        불러오는 중
      </p>
    );
  }

  if (data.letterCount === 0) {
    return (
      <p className="text-center text-sm text-ink-dim">남겨진 편지가 없어요.</p>
    );
  }

  return (
    <section className="flex flex-col gap-7">
      <p className="text-center text-sm leading-[1.6] text-ink-muted">
        {data.letterCount}명이 편지를 남겼어요.
        <br />
        공개일에 모든 편지를 볼 수 있어요.
      </p>

      <NicknameList nicknames={data.nicknames} />
    </section>
  );
}
