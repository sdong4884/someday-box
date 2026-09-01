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

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, variant = "info") => {
    const id = crypto.randomUUID();

    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));

    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);

    return id;
  },

  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

/** 컴포넌트 밖(쿼리 onError 등)에서 부르는 지름길. */
export const showToast = (message: string, variant?: ToastVariant) =>
  useToastStore.getState().show(message, variant);
