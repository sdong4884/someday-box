"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import { capsuleKeys } from "@/features/capsule/api/queryKeys";
import { deleteLetter } from "@/features/letter/api/deleteLetter";
import { updateLetter } from "@/features/letter/api/updateLetter";
import {
  updateLetterSchema,
  type UpdateLetterInput,
} from "@/features/letter/model/updateLetterSchema";
import type { UnlockedLetter } from "@/features/letter/ui/PasswordPrompt";
import {
  ContentField,
  InfoBanner,
  LOSS_WARNING,
  ReadonlyField,
} from "@/features/letter/ui/letterParts";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";
import { LoadingOverlay } from "@/shared/ui/LoadingOverlay";
import { Modal } from "@/shared/ui/Modal";
import { ScreenHeader } from "@/shared/ui/formParts";

/** 진짜 비밀번호는 화면에 그리지 않는다. 제출할 때만 state 에서 꺼낸다. */
const PASSWORD_MASK = "****";

const DELETE_TITLE_ID = "delete-letter-title";

export function EditLetterForm({
  slug,
  letter,
  onClose,
}: {
  slug: string;
  letter: UnlockedLetter;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateLetterInput>({
    resolver: zodResolver(updateLetterSchema),
    mode: "onTouched",
    defaultValues: { content: letter.content },
  });

  // watch() 로 바꾸면 React Compiler 가 이 컴포넌트를 건너뛴다.
  const content = useWatch({ control, name: "content" });

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submitting = useRef(false);

  const mutation = useMutation({
    mutationFn: (values: UpdateLetterInput) =>
      updateLetter({
        slug,
        nickname: letter.nickname,
        password: letter.password,
        content: values.content,
      }),
    onSuccess: () => {
      showToast("편지를 수정했어요");
      onClose();
    },
    onError: (error) => {
      showToast(getRpcErrorMessage(error), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteLetter({
        slug,
        nickname: letter.nickname,
        password: letter.password,
      }),
    onSuccess: () => {
      // 본문 수정과 달리 삭제는 닉네임 목록과 인원수를 바꾼다. 빼면 staleTime 동안 지운 닉네임이 참여 현황에 그대로 남는다.
      queryClient.invalidateQueries({ queryKey: capsuleKeys.summary(slug) });
      showToast("편지를 삭제했어요");
      onClose();
    },
    onError: (error) => {
      showToast(getRpcErrorMessage(error), "error");
    },
  });

  // 연타 방어. isSubmitting 은 리렌더가 있어야 서는데 한 프레임 안에 몰린 클릭은 전부 통과한다.
  // RPC 에 중복 방지 장치가 없어 그만큼 만들어진다. ref 는 즉시 선다.
  const submit = async (values: UpdateLetterInput) => {
    if (submitting.current) return;
    submitting.current = true;

    try {
      await mutation.mutateAsync(values);
    } catch {
      // 다시 낼 수 있게 여기서만 푼다. 성공 시엔 화면이 바뀔 때까지 잠근 채로 둔다.
      submitting.current = false;
    }
  };

  // 저장과 같은 ref 를 쓴다. 저장 중 삭제, 삭제 중 저장이 겹치지 않아야 한다.
  const remove = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setConfirmingDelete(false);

    try {
      await deleteMutation.mutateAsync();
    } catch {
      submitting.current = false;
    }
  };

  const deleting = deleteMutation.isPending || deleteMutation.isSuccess;

  // router.push 는 기다려주지 않는다. isSubmitting 이 먼저 떨어져 전환 전에 폼이 되살아난다.
  const locked = isSubmitting || mutation.isSuccess || deleting;

  return (
    <>
      <form
        onSubmit={(event) => handleSubmit(submit)(event)}
        noValidate
        className="flex flex-1 flex-col"
      >
        <ScreenHeader
          title="편지 쓰기"
          submitLabel={locked ? "저장 중" : "저장"}
          submitDisabled={locked}
          onCancel={onClose}
        />

        <div className="flex flex-col gap-6 px-5 py-6">
          <InfoBanner>{LOSS_WARNING}</InfoBanner>

          <ReadonlyField
            id="edit-nickname"
            label="닉네임"
            value={letter.nickname}
          />
          <ReadonlyField
            id="edit-password"
            label="비밀번호"
            value={PASSWORD_MASK}
          />

          <ContentField
            register={register("content")}
            length={content.length}
            error={errors.content?.message}
          />
        </div>

        <div className="mt-auto px-5 pb-6">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={locked}
            className="h-cta w-full rounded-button bg-surface-muted text-sm font-semibold text-ink-muted disabled:opacity-40"
          >
            편지 삭제
          </button>
        </div>

        {locked && (
          <LoadingOverlay
            label={
              deleting ? "편지를 삭제하는 중이에요" : "편지를 저장하는 중이에요"
            }
          />
        )}
      </form>

      {/* 폼 밖에 둔다. dialog 안의 버튼이 위 form 의 제출 버튼이 되지 않게. */}
      {confirmingDelete && (
        <DeleteConfirm
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function DeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open onClose={onCancel} labelledBy={DELETE_TITLE_ID}>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <h2 id={DELETE_TITLE_ID} className="text-base font-semibold text-ink">
            편지를 삭제할까요?
          </h2>
          <p className="text-xs leading-[1.6] text-ink-muted">
            삭제한 편지는 되돌릴 수 없어요.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-control flex-1 rounded-button bg-surface-muted text-sm font-semibold text-ink-muted"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-control flex-1 rounded-button bg-danger text-sm font-semibold text-bg"
          >
            삭제
          </button>
        </div>
      </div>
    </Modal>
  );
}
