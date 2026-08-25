"use client";

import { formatKstDate } from "@/domain/kstDate";
import { useCapsuleLetters } from "@/features/capsule/api/useCapsuleLetters";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { CapsuleHeader } from "@/features/capsule/ui/capsuleParts";
import type { CapsulePublic, LetterPublic } from "@/lib/dbColumns";

export function OpenedView({ capsule }: { capsule: CapsulePublic }) {
  const period = getCapsulePeriod(capsule);

  return (
    <div className="flex flex-1 flex-col gap-7 px-5 py-6">
      <CapsuleHeader capsule={capsule} />

      <p className="text-center text-xs text-ink-dim">
        {formatKstDate(period.openAt)} 공개
      </p>

      <LetterList slug={capsule.slug} capsuleId={capsule.id} />
    </div>
  );
}

function LetterList({ slug, capsuleId }: { slug: string; capsuleId: string }) {
  const { data, isPending, isError } = useCapsuleLetters(slug, capsuleId);

  if (isError) return null;

  if (isPending) {
    return (
      <p aria-hidden="true" className="invisible text-sm">
        불러오는 중
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-ink-dim">남겨진 편지가 없어요.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {data.map((letter) => (
        <li key={letter.id}>
          <LetterCard letter={letter} />
        </li>
      ))}
    </ul>
  );
}

function LetterCard({ letter }: { letter: LetterPublic }) {
  return (
    <article className="flex flex-col gap-3 rounded-card border border-line-strong bg-surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{letter.nickname}</h2>
        <time
          dateTime={letter.created_at}
          className="shrink-0 text-xs text-ink-dim"
        >
          {formatKstDate(new Date(letter.created_at))}
        </time>
      </div>

      {/* textarea 에 친 그대로 보여야 한다. pre-wrap 이 없으면 줄바꿈이 전부 사라진다. */}
      <p className="text-sm leading-[1.7] whitespace-pre-wrap break-words text-ink">
        {letter.content}
      </p>
    </article>
  );
}
