"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
    formState: { errors },
  } = useForm<UpdateLetterInput>({
    resolver: zodResolver(updateLetterSchema),
    mode: "onTouched",
    defaultValues: { content: letter.content },
  });

  // watch() 로 바꾸면 React Compiler 가 이 컴포넌트를 건너뛴다.
  const content = useWatch({ control, name: "content" });

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

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      // 없으면 네이티브 말풍선이 submit 을 막아 zod 문구가 화면에 닿지 못한다.
      noValidate
      className="flex flex-1 flex-col"
    >
      <ScreenHeader
        title="편지 쓰기"
        submitLabel={mutation.isPending ? "저장 중" : "저장"}
        submitDisabled={mutation.isPending}
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
    </form>
  );
}
