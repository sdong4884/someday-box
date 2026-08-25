"use client";

import Link from "next/link";
import { type CapsuleStatus, writeUntilDisplayDate } from "@/domain/capsule";
import { formatKstDate } from "@/domain/kstDate";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import type { CapsulePublic } from "@/lib/dbColumns";
import { showToast } from "@/shared/toast/toastStore";

export function CapsuleSummary({
  capsule,
  status,
}: {
  capsule: CapsulePublic;
  status: CapsuleStatus | null;
}) {
  const period = getCapsulePeriod(capsule);

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <StatusLabel status={status} />

      <h1 className="text-4xl font-bold tracking-[-0.01em] text-ink">
        {capsule.title}
      </h1>

      {/* 라벨 용어는 docs/decisions.md §6 을 따른다 — `만료일` 이 아니라 `공개일`. */}
      <dl className="flex flex-col gap-2">
        <DateRow
          label="작성 마감일"
          date={writeUntilDisplayDate(period.writeUntil)}
        />
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

export function CapsuleHeader({ capsule }: { capsule: CapsulePublic }) {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
      <Link href="/" aria-label="홈으로" className={ICON_BUTTON_CLASS}>
        <HomeIcon />
      </Link>

      <h1 className="truncate text-center text-base font-semibold text-ink">
        {capsule.title}
      </h1>

      <ShareButton />
    </header>
  );
}

const ICON_BUTTON_CLASS =
  "flex size-control items-center justify-center rounded-full bg-surface text-accent-soft transition-opacity active:opacity-70";

function ShareButton() {
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");

      await navigator.clipboard.writeText(window.location.href);
      showToast("링크가 복사되었어요");
    } catch {
      showToast("링크를 복사하지 못했어요. 주소창에서 복사해 주세요.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="링크 복사"
      className={ICON_BUTTON_CLASS}
    >
      <ShareIcon />
    </button>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" />
    </svg>
  );
}

export function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </svg>
  );
}
