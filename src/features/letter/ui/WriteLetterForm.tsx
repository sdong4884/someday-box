"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { capsuleKeys } from "@/features/capsule/api/queryKeys";
import { createLetter } from "@/features/letter/api/createLetter";
import { toCreateLetterFieldError } from "@/features/letter/model/createLetterError";
import {
  createLetterSchema,
  LETTER_CONTENT_MAX_LENGTH,
  LETTER_NICKNAME_MAX_LENGTH,
  LETTER_PASSWORD_MAX_LENGTH,
  type CreateLetterInput,
} from "@/features/letter/model/createLetterSchema";
import {
  CharCounter,
  InfoBanner,
} from "@/features/letter/ui/letterParts";
import type { CapsulePublic } from "@/lib/dbColumns";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";
import {
  Field,
  INPUT_CLASS,
  ScreenHeader,
  TEXTAREA_CLASS,
  fieldAria,
} from "@/shared/ui/formParts";

export const LOSS_WARNING = "닉네임과 비밀번호를 잊으면 편지를 수정할 수 없어요.";

export function WriteLetterForm({ capsule }: { capsule: CapsulePublic }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const capsuleHref = `/c/${capsule.slug}`;

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateLetterInput>({
    resolver: zodResolver(createLetterSchema),
    mode: "onTouched",
    defaultValues: { nickname: "", password: "", content: "" },
  });

  // watch() 로 바꾸면 React Compiler 가 이 컴포넌트를 건너뛴다.
  const content = useWatch({ control, name: "content" });

  const mutation = useMutation({
    mutationFn: (values: CreateLetterInput) =>
      createLetter({ ...values, slug: capsule.slug }),
    onSuccess: () => {
      // 없으면 staleTime 60초 동안 방금 쓴 편지가 참여 현황에 안 보인다.
      queryClient.invalidateQueries({
        queryKey: capsuleKeys.summary(capsule.slug),
      });
      router.push(capsuleHref);
    },
    onError: (error) => {
      const fieldError = toCreateLetterFieldError(error);

      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        return;
      }

      showToast(getRpcErrorMessage(error), "error");
    },
  });

  const nicknameAria = fieldAria({
    id: "nickname",
    error: errors.nickname?.message,
  });
  const passwordAria = fieldAria({
    id: "password",
    error: errors.password?.message,
  });
  const contentAria = fieldAria({
    id: "content",
    error: errors.content?.message,
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
        // router.back() 은 쓰지 않는다 — 공유 링크로 바로 들어오면 돌아갈 히스토리가 없다.
        onCancel={() => router.push(capsuleHref)}
      />

      <div className="flex flex-col gap-6 px-5 py-6">
        <InfoBanner>{LOSS_WARNING}</InfoBanner>

        <Field id="nickname" label="닉네임" error={errors.nickname?.message}>
          <input
            {...register("nickname")}
            {...nicknameAria}
            type="text"
            placeholder="편지에 표시돼요"
            maxLength={LETTER_NICKNAME_MAX_LENGTH}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </Field>

        <Field id="password" label="비밀번호" error={errors.password?.message}>
          <input
            {...register("password")}
            {...passwordAria}
            type="password"
            placeholder="수정할 때 필요해요"
            maxLength={LETTER_PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            className={INPUT_CLASS}
          />
        </Field>

        <Field id="content" label="내용" error={errors.content?.message}>
          <textarea
            {...register("content")}
            {...contentAria}
            placeholder="마음을 담아 적어주세요"
            maxLength={LETTER_CONTENT_MAX_LENGTH}
            className={TEXTAREA_CLASS}
          />
          <CharCounter
            length={content.length}
            max={LETTER_CONTENT_MAX_LENGTH}
          />
        </Field>
      </div>
    </form>
  );
}
