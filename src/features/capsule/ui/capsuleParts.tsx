"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { CapsulePublic } from "@/lib/dbColumns";
import { showToast } from "@/shared/toast/toastStore";

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

export function CountdownCard({
  icon,
  label,
  dday,
  caption,
}: {
  icon: ReactNode;
  label: string;
  dday: string;
  caption: string;
}) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-card border border-line-strong bg-surface px-5 py-7">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent-deep">
        {icon}
      </span>

      <p className="text-xs font-medium text-accent-soft">{label}</p>

      <p className="text-4xl font-bold tracking-[-0.01em] text-ink">{dday}</p>

      <p className="text-xs text-ink-dim">{caption}</p>
    </section>
  );
}

const BADGE_CLASS = "rounded-pill bg-surface px-3 py-1.5 text-xs text-ink-muted";

/**
 * `onSelect` 가 없으면 `<span>` 이다. disabled 버튼은 스크린 리더가 "사용 불가 버튼" 으로
 * 읽어 언젠가 눌릴 수 있는 것처럼 들린다 — 잠긴 캡슐의 닉네임은 라벨이지 조작 대상이 아니다.
 */
export function NicknameList({
  nicknames,
  onSelect,
}: {
  nicknames: string[];
  onSelect?: (nickname: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {nicknames.map((nickname) => (
        <li key={nickname}>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(nickname)}
              className={`${BADGE_CLASS} transition-opacity active:opacity-70`}
            >
              {nickname}
            </button>
          ) : (
            <span className={`${BADGE_CLASS} block`}>{nickname}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function LockIcon({ className }: { className?: string }) {
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
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
