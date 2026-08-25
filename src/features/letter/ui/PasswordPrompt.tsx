"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { getLetter } from "@/features/letter/api/getLetter";
import { toUnlockLetterFieldError } from "@/features/letter/model/unlockLetterError";
import {
  unlockLetterSchema,
  type UnlockLetterInput,
} from "@/features/letter/model/updateLetterSchema";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";
import { Modal } from "@/shared/ui/Modal";
import { ERROR_CLASS, INPUT_CLASS, fieldAria } from "@/shared/ui/formParts";

export type UnlockedLetter = {
  nickname: string;
  password: string;
  content: string;
};

const TITLE_ID = "password-prompt-title";

export function PasswordPrompt({
  slug,
  nickname,
  onUnlock,
  onClose,
}: {
  slug: string;
  nickname: string;
  onUnlock: (letter: UnlockedLetter) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnlockLetterInput>({
    resolver: zodResolver(unlockLetterSchema),
    defaultValues: { password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: UnlockLetterInput) =>
      getLetter({ slug, nickname, password: values.password }),
    onSuccess: (letter, values) => {
      if (!letter) {
        showToast("편지를 찾을 수 없어요.", "error");
        onClose();
        return;
      }

      onUnlock({ nickname, password: values.password, content: letter.content });
    },
    onError: (error) => {
      const fieldError = toUnlockLetterFieldError(error);

      // 비밀번호가 틀린 것은 모달 안에서 고칠 수 있다. 그 외는 닫고 토스트로.
      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        return;
      }

      showToast(getRpcErrorMessage(error), "error");
      onClose();
    },
  });

  const passwordAria = fieldAria({
    id: "unlock-password",
    error: errors.password?.message,
  });

  return (
    <Modal open onClose={onClose} labelledBy={TITLE_ID}>
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
        className="flex flex-col gap-5 p-5"
      >
        <div className="flex flex-col gap-2">
          <h2 id={TITLE_ID} className="text-base font-semibold text-ink">
            {nickname}님의 편지
          </h2>
          <p className="text-xs leading-[1.6] text-ink-muted">
            비밀번호를 입력하면 편지를 수정할 수 있어요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            {...register("password")}
            {...passwordAria}
            type="password"
            placeholder="비밀번호"
            autoComplete="off"
            autoFocus
            className={INPUT_CLASS}
          />
          {errors.password && (
            <p id="unlock-password-error" className={ERROR_CLASS}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-control flex-1 rounded-button bg-surface-muted text-sm font-semibold text-ink-muted"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-control flex-1 rounded-button bg-accent text-sm font-semibold text-bg disabled:opacity-40"
          >
            {mutation.isPending ? "확인 중" : "확인"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
