"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

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
import { ScreenHeader } from "@/shared/ui/formParts";

/** 진짜 비밀번호는 화면에 그리지 않는다. 제출할 때만 state 에서 꺼낸다. */
const PASSWORD_MASK = "****";

export function EditLetterForm({
  slug,
  letter,
  onClose,
}: {
  slug: string;
  letter: UnlockedLetter;
  onClose: () => void;
}) {
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

  // 연타 방어. isSubmitting 은 리렌더가 있어야 서는데 한 프레임 안에 몰린 클릭은 전부
  // 통과한다. RPC 에 중복 방지 장치가 없어 그만큼 만들어진다. ref 는 즉시 선다.
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

  // router.push 는 기다려주지 않는다. isSubmitting 이 먼저 떨어져 전환 전에 폼이 되살아난다.
  const locked = isSubmitting || mutation.isSuccess;

  return (
    <form
      // render 중에 부르면 submit 이 닫고 있는 ref 를 그때 읽는 것으로 보여 lint 가 막는다.
      onSubmit={(event) => handleSubmit(submit)(event)}
      // 없으면 네이티브 말풍선이 submit 을 막아 zod 문구가 화면에 닿지 못한다.
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

        <ReadonlyField id="edit-nickname" label="닉네임" value={letter.nickname} />
        <ReadonlyField id="edit-password" label="비밀번호" value={PASSWORD_MASK} />

        <ContentField
          register={register("content")}
          length={content.length}
          error={errors.content?.message}
        />
      </div>

      {locked && <LoadingOverlay label="편지를 저장하는 중이에요" />}
    </form>
  );
}
