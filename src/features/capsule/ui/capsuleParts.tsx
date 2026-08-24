import { type CapsuleStatus, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import type { CapsulePublic } from "@/lib/dbColumns";

export function CapsuleSummary({
  capsule,
  status,
}: {
  capsule: CapsulePublic;
  status: CapsuleStatus | null;
}) {
  const period = getCapsulePeriod(capsule);

  return (
    <div className="flex flex-col gap-6">
      <StatusLabel status={status} />

      <h1 className="text-4xl font-bold tracking-[-0.01em] text-ink">
        {capsule.title}
      </h1>

      {/* 라벨 용어는 docs/decisions.md §6 을 따른다 — `만료일` 이 아니라 `공개일`. */}
      <dl className="flex flex-col gap-2">
        <DateRow label="작성 마감일" date={writeUntilDisplayDate(period.writeUntil)} />
        <DateRow label="공개일" date={period.openAt} />
      </dl>
    </div>
  );
}

function StatusLabel({ status }: { status: CapsuleStatus | null }) {
  /** null 을 안 그리고 감춰 그린다. 자리를 비우면 상태가 채워질 때 아래가 밀린다. */
  if (status === null) {
    return (
      <p aria-hidden="true" className="invisible text-sm font-semibold">
        WRITING
      </p>
    );
  }

  return <p className="text-sm font-semibold text-accent-soft">{status}</p>;
}

function DateRow({ label, date }: { label: string; date: Date }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink">{formatKstDate(date)}</dd>
    </div>
  );
}
