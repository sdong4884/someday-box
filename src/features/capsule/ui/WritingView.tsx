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
  EnvelopeIcon,
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
}: {
  capsule: CapsulePublic;
  now: Date;
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

      <DeadlineCard
        daysLeft={getWriteDaysLeft(period, now)}
        deadline={writeUntilDisplayDate(period.writeUntil)}
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

function DeadlineCard({
  daysLeft,
  deadline,
}: {
  daysLeft: number;
  deadline: Date;
}) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-card border border-line-strong bg-surface px-5 py-7">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent-deep">
        <EnvelopeIcon className="size-6 text-accent-soft" />
      </span>

      <p className="text-xs font-medium text-accent-soft">작성 마감까지</p>

      <p className="text-4xl font-bold tracking-[-0.01em] text-ink">
        {formatDdayLabel(daysLeft)}
      </p>

      {/* 라벨 용어는 docs/decisions.md §6 을 따른다. 저장값이 아니라 고른 날짜다. */}
      <p className="text-xs text-ink-dim">{formatKstDate(deadline)}까지</p>
    </section>
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
      <p className="text-sm leading-[1.6] text-ink-dim">
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
      <ul className="flex flex-wrap gap-2">
        {data.nicknames.map((nickname) => (
          <li key={nickname}>
            <button
              type="button"
              onClick={() => setPending(nickname)}
              className="rounded-pill bg-surface px-3 py-1.5 text-xs text-ink-muted transition-opacity active:opacity-70"
            >
              {nickname}
            </button>
          </li>
        ))}
      </ul>

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
