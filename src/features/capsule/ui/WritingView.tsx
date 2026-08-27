"use client";

import Link from "next/link";
import { useState } from "react";
import { getWriteDaysLeft, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";
import { useCapsuleSummary } from "@/features/capsule/api/useCapsuleSummary";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { formatDdayLabel } from "@/features/capsule/model/dday";
import {
  CapsuleHeader,
  CountdownCard,
  EnvelopeIcon,
  NicknameList,
} from "@/features/capsule/ui/capsuleParts";
import { EditLetterForm } from "@/features/letter/ui/EditLetterForm";
import {
  PasswordPrompt,
  type UnlockedLetter,
} from "@/features/letter/ui/PasswordPrompt";
import type { CapsulePublic } from "@/lib/dbColumns";

export function WritingView({
  capsule,
  now,
  capsuleUrl,
}: {
  capsule: CapsulePublic;
  now: Date;
  capsuleUrl: string;
}) {
  const period = getCapsulePeriod(capsule);

  // 비밀번호가 사는 유일한 곳. 언마운트되면 함께 사라진다.
  const [unlocked, setUnlocked] = useState<UnlockedLetter | null>(null);

  if (unlocked) {
    return (
      <EditLetterForm
        slug={capsule.slug}
        letter={unlocked}
        onClose={() => setUnlocked(null)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-7 px-5 py-6">
      <CapsuleHeader capsule={capsule} />

      <CountdownCard
        icon={<EnvelopeIcon className="size-6 text-accent-soft" />}
        label="작성 마감까지"
        dday={formatDdayLabel(getWriteDaysLeft(period, now))}
        caption={`${formatKstDate(writeUntilDisplayDate(period.writeUntil))}까지`}
        slug={capsule.slug}
        title={capsule.title}
        openAt={period.openAt}
        capsuleUrl={capsuleUrl}
      />

      <Participation slug={capsule.slug} onUnlock={setUnlocked} />

      <Link
        href={`/c/${capsule.slug}/write`}
        className="mt-auto flex h-cta w-full items-center justify-center rounded-button bg-accent text-base font-semibold text-bg"
      >
        편지 쓰기
      </Link>
    </div>
  );
}

function Participation({
  slug,
  onUnlock,
}: {
  slug: string;
  onUnlock: (letter: UnlockedLetter) => void;
}) {
  const { data, isPending, isError } = useCapsuleSummary(slug);
  const [pending, setPending] = useState<string | null>(null);

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
      <p className="text-center text-sm leading-[1.6] text-ink-dim">
        아직 편지가 없어요.
        <br />첫 편지를 남겨볼까요?
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-7">
      <p className="text-sm text-ink-muted text-center">
        {data.letterCount}명이 편지를 남겼어요.
      </p>
      <NicknameList nicknames={data.nicknames} onSelect={setPending} />

      {pending && (
        <PasswordPrompt
          slug={slug}
          nickname={pending}
          onUnlock={(letter) => {
            setPending(null);
            onUnlock(letter);
          }}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  );
}
