import { create } from "zustand";

export type ToastVariant = "info" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export const TOAST_DURATION_MS = 4000;

type ToastState = {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant) => string;
  dismiss: (id: string) => void;
};

/**
 * 토스트 큐.
 *
 * 컴포넌트 밖에서도 띄울 수 있게 훅이 아니라 스토어로 둔다 — 쿼리 onError 나
 * 이벤트 핸들러에서 `useToastStore.getState().show(...)` 로 부른다.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, variant = "info") => {
    const id = crypto.randomUUID();

    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));

    // 사용자가 먼저 닫았으면 dismiss 가 이미 지웠고, 이 호출은 무해하다.
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);

    return id;
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

/** 컴포넌트 밖에서 부르는 지름길. */
export const showToast = (message: string, variant?: ToastVariant) =>
  useToastStore.getState().show(message, variant);
