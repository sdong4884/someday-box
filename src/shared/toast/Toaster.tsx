"use client";

import { useToastStore } from "@/shared/toast/toastStore";

const VARIANT_CLASS = {
  info: "bg-zinc-900/95 text-zinc-50",
  error: "bg-red-600/95 text-white",
} as const;

/**
 * 토스트 표시 영역. 루트 레이아웃에 한 번만 둔다.
 *
 * 카카오톡 인앱 브라우저의 하단 바에 가리지 않도록 safe-area 만큼 띄운다
 * (CLAUDE.md 핵심 규칙 4).
 *
 * 너비는 글자 수만큼(`w-fit`), 대신 `max-w-sm` 에서 멈추고 줄바꿈한다. 짧은 문구가
 * 넓은 상자에 왼쪽으로 붙어 보이지 않게 하려는 것이다. 긴 문구는 여러 줄이 되므로
 * 정렬은 왼쪽으로 둔다 — 여러 줄을 가운데 정렬하면 읽기 흐름이 끊긴다.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`pointer-events-auto w-fit max-w-sm rounded-xl px-4 py-3 text-left text-sm break-words shadow-lg ${VARIANT_CLASS[toast.variant]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
