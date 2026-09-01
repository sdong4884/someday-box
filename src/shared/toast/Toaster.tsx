"use client";

import { useToastStore } from "@/shared/toast/toastStore";

const VARIANT_CLASS = {
  info: "border border-line-strong bg-surface text-ink",
  error: "bg-danger text-bg",
} as const;

/** 카카오톡 인앱 브라우저의 하단 바에 가리지 않도록 safe-area 만큼 띄운다. */
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
          className={`pointer-events-auto w-fit max-w-sm rounded-card px-4 py-3 text-left text-sm break-words shadow-lg ${VARIANT_CLASS[toast.variant]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
