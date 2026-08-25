"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 네이티브 `<dialog>` 를 쓴다. 포커스 트랩·Escape·top layer·배경 inert 를 브라우저가 준다.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      // Escape 는 close 가 아니라 cancel 로 온다. 이걸 놓치면 state 만 열린 채 남는다.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // dialog 자신이 backdrop 영역까지 차지하므로, 안쪽 카드 밖을 누른 것이 backdrop 클릭이다.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-card border border-line-strong bg-surface p-0 text-ink backdrop:bg-bg/80"
    >
      {children}
    </dialog>
  );
}
