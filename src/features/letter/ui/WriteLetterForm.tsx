"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { capsuleKeys } from "@/features/capsule/api/queryKeys";
import { createLetter } from "@/features/letter/api/createLetter";
import { toCreateLetterFieldError } from "@/features/letter/model/createLetterError";
import {
  createLetterSchema,
  LETTER_NICKNAME_MAX_LENGTH,
  LETTER_PASSWORD_MAX_LENGTH,
  type CreateLetterInput,
} from "@/features/letter/model/createLetterSchema";
import {
  ContentField,
  InfoBanner,
  LOSS_WARNING,
} from "@/features/letter/ui/letterParts";
import type { CapsulePublic } from "@/lib/dbColumns";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";
import { LoadingOverlay } from "@/shared/ui/LoadingOverlay";
import {
  Field,
  INPUT_CLASS,
  ScreenHeader,
  fieldAria,
} from "@/shared/ui/formParts";

export function WriteLetterForm({ capsule }: { capsule: CapsulePublic }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const capsuleHref = `/c/${capsule.slug}`;

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateLetterInput>({
    resolver: zodResolver(createLetterSchema),
    mode: "onTouched",
    defaultValues: { nickname: "", password: "", content: "" },
  });

  // watch() 로 바꾸면 React Compiler 가 이 컴포넌트를 건너뛴다.
  const content = useWatch({ control, name: "content" });

  const submitting = useRef(false);

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
  // 연타 방어. isSubmitting 은 리렌더가 있어야 서는데 한 프레임 안에 몰린 클릭은 전부
  // 통과한다. RPC 에 중복 방지 장치가 없어 그만큼 만들어진다. ref 는 즉시 선다.
  const submit = async (values: CreateLetterInput) => {
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
