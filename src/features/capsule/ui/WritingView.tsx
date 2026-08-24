import Link from "next/link";

import { getWriteDaysLeft, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";
import { useCapsuleSummary } from "@/features/capsule/api/useCapsuleSummary";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { formatDdayLabel } from "@/features/capsule/model/dday";
import {
  CapsuleHeader,
  EnvelopeIcon,
} from "@/features/capsule/ui/capsuleParts";
import type { CapsulePublic } from "@/lib/dbColumns";

export function WritingView({
  capsule,
  now,
}: {
  capsule: CapsulePublic;
  now: Date;
}) {
  const period = getCapsulePeriod(capsule);

  return (
    <div className="flex flex-1 flex-col gap-7">
      <CapsuleHeader capsule={capsule} />

      <DeadlineCard
        daysLeft={getWriteDaysLeft(period, now)}
        deadline={writeUntilDisplayDate(period.writeUntil)}
      />

      <Participation slug={capsule.slug} />

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

function Participation({ slug }: { slug: string }) {
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
          <li
            key={nickname}
            className="rounded-pill bg-surface px-3 py-1.5 text-xs text-ink-muted"
          >
            {nickname}
          </li>
        ))}
      </ul>
    </section>
  );
}
