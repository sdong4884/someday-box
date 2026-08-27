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
  /*
   * 연타 방어. isSubmitting 은 React 상태라 리렌더가 있어야 버튼이 잠기는데, 한 프레임 안에
   * 클릭이 몰리면 그 사이 리렌더가 없어 전부 통과한다. create_capsule 은 중복 방지 장치가
   * 없어 그만큼 캡슐이 생긴다. ref 는 리렌더와 무관하게 즉시 선다.
   */
  const submit = async (values: CreateLetterInput) => {
    if (submitting.current) return;
    submitting.current = true;

    try {
      await mutation.mutateAsync(values);
      // 성공하면 풀지 않는다. 화면이 바뀔 때까지 이 폼은 잠긴 채로 있어야 한다.
    } catch {
      // 실패 처리는 onError 가 한다. 다시 낼 수 있게 여기서만 푼다.
      submitting.current = false;
    }
  };

  /*
   * router.push 는 기다려주지 않는다. mutateAsync 가 끝나면 isSubmitting 이 바로 떨어지는데
   * 화면 전환은 그 뒤라, 그 사이에 폼이 되살아나 버튼이 다시 눌린다. 성공 후에는 언마운트될
   * 때까지 덮어 둔다.
   */
  const locked = isSubmitting || mutation.isSuccess;

  return (
    <form
      // handleSubmit 을 이벤트 안에서 부른다. render 중에 부르면 submit 이 닫고 있는
      // ref 를 그때 읽는 것으로 보여 react-hooks/refs 가 막는다.
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
