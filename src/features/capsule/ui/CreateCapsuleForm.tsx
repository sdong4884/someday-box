"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  addKstDays,
  addKstYears,
  isKstDateString,
  toKstDateString,
} from "@/domain/kstDate";
import { createCapsule } from "@/features/capsule/api/createCapsule";
import { toCreateCapsuleFieldError } from "@/features/capsule/model/createCapsuleError";
import {
  CAPSULE_OPEN_AT_MAX_YEARS,
  CAPSULE_TITLE_MAX_LENGTH,
  createCapsuleSchema,
  type CreateCapsuleInput,
} from "@/features/capsule/model/createCapsuleSchema";
import {
  DateInput,
  Field,
  INPUT_CLASS,
  ScreenHeader,
  fieldAria,
  openDatePicker,
} from "@/features/capsule/ui/formParts";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";

const WRITE_UNTIL_HINT = "이 날짜까지만 편지를 남길 수 있어요.";
const OPEN_AT_HINT = "공개일이 되면 모든 편지가 한번에 열려요.";

/**
 * 캡슐 생성 폼.
 *
 * `now` 를 non-null 로 받는다 — 시각이 없는 상태는 부모(CreateCapsuleScreen)가 처리하고,
 * 여기서는 스키마를 조건 없이 만든다. 덕분에 useMemo 가 훅 순서에 걸리지 않는다.
 *
 * `now` 는 nowStore 가 참조를 캐시하므로 매 렌더 새로 계산되지 않고, 개발용 시간 이동으로
 * 시각을 밀면 스키마와 달력의 하한이 함께 움직인다.
 */
export function CreateCapsuleForm({ now }: { now: Date }) {
  const router = useRouter();

  const schema = useMemo(() => createCapsuleSchema(now), [now]);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateCapsuleInput>({
    resolver: zodResolver(schema),
    // 칸을 벗어나는 순간 첫 검증이 돌고, 그 뒤로는 고칠 때마다 즉시 재검증된다.
    // 달력이 min/max 를 지키지 않는 웹뷰(iOS)에서 범위 밖 날짜를 골라도 제출까지
    // 기다리지 않고 바로 알 수 있다.
    mode: "onTouched",
    defaultValues: { title: "", writeUntil: "", openAt: "" },
  });

  // watch() 가 아니라 useWatch 를 쓴다. watch 가 돌려주는 함수는 메모이즈할 수 없어서
  // React Compiler 가 이 컴포넌트의 컴파일을 통째로 건너뛴다.
  const writeUntil = useWatch({ control, name: "writeUntil" });
  const openAt = useWatch({ control, name: "openAt" });

  const mutation = useMutation({
    mutationFn: createCapsule,
    onSuccess: (slug) => {
      router.push(`/c/${slug}`);
    },
    onError: (error) => {
      // 폼이 고칠 수 있는 실패는 해당 칸에 붙이고, 나머지(권한·스키마 캐시·네트워크)는
      // 토스트로 보낸다. 재시도는 providers.tsx 가 이미 0 으로 막아 뒀다 —
      // 캡슐 생성의 재시도는 곧 중복 생성이다.
      const fieldError = toCreateCapsuleFieldError(error);

      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        return;
      }

      showToast(getRpcErrorMessage(error), "error");
    },
  });

  // 달력에서 고를 수 있는 범위를 스키마와 같은 규칙으로 좁힌다. 스키마가 어차피 거부할
  // 날짜를 아예 집지 못하게 해서, 고를 수 있는 날짜와 통과하는 날짜를 일치시킨다.
  //
  // 두 칸이 서로의 범위를 좁힌다 — 공개일이 정해지면 작성 마감일의 상한이 되고, 그 반대도
  // 마찬가지다. 다만 이건 어디까지나 달력에 주는 힌트다. 지키는지는 브라우저 재량이고
  // (iOS 는 막아 주지 않는다) 실제 판정은 zod 와 DB 가 한다. form 의 noValidate 참고.
  const today = toKstDateString(now);
  const openAtLimit = addKstYears(today, CAPSULE_OPEN_AT_MAX_YEARS);

  const writeUntilMin = addKstDays(today, 1);
  const writeUntilMax = isKstDateString(openAt)
    ? addKstDays(openAt, -1)
    : addKstDays(openAtLimit, -1);

  const openAtMin = isKstDateString(writeUntil)
    ? addKstDays(writeUntil, 1)
    : addKstDays(today, 2);
  const openAtMax = openAtLimit;

  const titleAria = fieldAria({ id: "title", error: errors.title?.message });
  const writeUntilAria = fieldAria({
    id: "writeUntil",
    hint: WRITE_UNTIL_HINT,
    error: errors.writeUntil?.message,
  });
  const openAtAria = fieldAria({
    id: "openAt",
    hint: OPEN_AT_HINT,
    error: errors.openAt?.message,
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      // 네이티브 제약 검증을 끈다. min/max 는 달력 범위를 좁히려고 붙인 것인데, 그대로 두면
      // 브라우저가 제출 시 자기 말풍선을 띄우고 submit 이벤트 자체를 막아 zod 문구가 화면에
      // 닿지 못한다. 판정은 zod 하나로 모으고 문구는 전부 칸 아래에 붙인다.
      noValidate
      className="flex flex-1 flex-col"
    >
      <ScreenHeader
        submitLabel={mutation.isPending ? "만드는 중" : "생성"}
        submitDisabled={mutation.isPending}
        onCancel={() => router.push("/")}
      />

      <div className="flex flex-col gap-6 px-5 py-6">
        <Field id="title" label="캡슐 제목" error={errors.title?.message}>
          <input
            {...register("title")}
            {...titleAria}
            type="text"
            placeholder="예: 2027년, 우리에게"
            maxLength={CAPSULE_TITLE_MAX_LENGTH}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id="writeUntil"
          label="작성 마감일"
          hint={WRITE_UNTIL_HINT}
          error={errors.writeUntil?.message}
        >
          <DateInput
            {...register("writeUntil")}
            {...writeUntilAria}
            min={writeUntilMin}
            max={writeUntilMax}
            onClick={openDatePicker}
            isEmpty={!writeUntil}
          />
        </Field>

        <Field
          id="openAt"
          label="공개일"
          hint={OPEN_AT_HINT}
          error={errors.openAt?.message}
        >
          <DateInput
            {...register("openAt")}
            {...openAtAria}
            min={openAtMin}
            max={openAtMax}
            onClick={openDatePicker}
            isEmpty={!openAt}
          />
        </Field>
      </div>
    </form>
  );
}
