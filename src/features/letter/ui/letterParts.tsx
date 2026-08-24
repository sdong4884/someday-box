export function InfoBanner({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 rounded-card bg-surface px-3.5 py-3 text-xs leading-[1.6] text-ink-muted">
      <InfoIcon />
      {children}
    </p>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-px size-4 shrink-0 text-accent-soft"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.8v.4" />
    </svg>
  );
}

// aria-hidden 이다 — 한 글자마다 낭독되면 입력을 방해한다. 길이 초과는 에러 문구가 알린다.
export function CharCounter({ length, max }: { length: number; max: number }) {
  return (
    <p aria-hidden="true" className="text-right text-xs text-ink-dim">
      {length}/{max}
    </p>
  );
}
