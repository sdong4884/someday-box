"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  addKstDays,
  addKstYears,
  formatKstDate,
  isKstDateString,
  kstDateStringToUtc,
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
} from "@/shared/ui/formParts";
import { getRpcErrorMessage } from "@/lib/rpcError";
import { showToast } from "@/shared/toast/toastStore";
import { LoadingOverlay } from "@/shared/ui/LoadingOverlay";
import { Modal } from "@/shared/ui/Modal";

const WRITE_UNTIL_HINT = "이 날짜까지만 편지를 남길 수 있어요.";
const OPEN_AT_HINT = "공개일이 되면 모든 편지가 한번에 열려요.";

const CONFIRM_TITLE_ID = "create-capsule-confirm-title";

/** `now` 를 non-null 로 받아야 스키마를 조건 없이 만들 수 있다 — useMemo 가 훅 순서에 안 걸린다. */
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
    // 달력이 min/max 를 안 지키는 웹뷰(iOS)에서 범위 밖 날짜를 골라도 제출 전에 알 수 있다.
    mode: "onTouched",
    defaultValues: { title: "", writeUntil: "", openAt: "" },
  });

  // watch() 로 바꾸면 React Compiler 가 이 컴포넌트를 건너뛴다.
  const writeUntil = useWatch({ control, name: "writeUntil" });
  const openAt = useWatch({ control, name: "openAt" });

  const [pending, setPending] = useState<CreateCapsuleInput | null>(null);

  const submitting = useRef(false);

  const mutation = useMutation({
    mutationFn: createCapsule,
    onSuccess: (slug) => {
      router.push(`/c/${slug}`);
    },
    onError: (error) => {
      // 재시도는 providers.tsx 가 0 으로 막아 뒀다 — 캡슐 생성의 재시도는 곧 중복 생성이다.
      const fieldError = toCreateCapsuleFieldError(error);

      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        return;
      }

      showToast(getRpcErrorMessage(error), "error");
    },
  });

  // 달력에 주는 힌트일 뿐이다. 지키는지는 브라우저 재량이고(iOS 는 안 막는다) 판정은
  // zod 와 DB 가 한다.
  const today = toKstDateString(now);
  const openAtLimit = addKstYears(today, CAPSULE_OPEN_AT_MAX_YEARS);

  const writeUntilMin = today;
  const writeUntilMax = isKstDateString(openAt)
    ? addKstDays(openAt, -1)
    : addKstDays(openAtLimit, -1);

  const openAtMin = isKstDateString(writeUntil)
    ? addKstDays(writeUntil, 1)
    : addKstDays(today, 1);
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

  // 제출은 모달만 열고, 만드는 것은 confirm 이 한다.
  const submit = (values: CreateCapsuleInput) => setPending(values);

  // 연타 방어. 한 프레임 안에 몰린 클릭은 리렌더를 기다리는 isPending 을 전부 통과한다.
  // RPC 에 중복 방지 장치가 없어 그만큼 캡슐이 만들어진다. ref 는 즉시 선다.
  const confirm = async () => {
    if (!pending || submitting.current) return;

    const values = pending;
    submitting.current = true;
    setPending(null);

    try {
      await mutation.mutateAsync(values);
    } catch {
      // 다시 낼 수 있게 여기서만 푼다. 성공 시엔 화면이 바뀔 때까지 잠근 채로 둔다.
      submitting.current = false;
    }
  };

  // isSubmitting 을 쓸 수 없다 — submit 이 모달만 열고 끝나 한 틱 만에 false 로 떨어진다.
  // router.push 는 기다려주지 않으므로 isSuccess 도 함께 본다.
  const locked = mutation.isPending || mutation.isSuccess;

  return (
    <>
      <form
        onSubmit={(event) => handleSubmit(submit)(event)}
        noValidate
        className="flex flex-1 flex-col"
      >
        <ScreenHeader
          title="새 캡슐"
          submitLabel={locked ? "만드는 중" : "생성"}
          submitDisabled={locked}
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
              isEmpty={!openAt}
            />
          </Field>
        </div>

        {locked && <LoadingOverlay label="캡슐을 만드는 중이에요" />}
      </form>

      {/* 폼 밖에 둔다. dialog 안의 버튼이 위 form 의 제출 버튼이 되지 않게. */}
      {pending && (
        <CreateConfirm
          values={pending}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

function CreateConfirm({
  values,
  onCancel,
  onConfirm,
}: {
  values: CreateCapsuleInput;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open onClose={onCancel} labelledBy={CONFIRM_TITLE_ID}>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <h2
            id={CONFIRM_TITLE_ID}
            className="text-base font-semibold text-ink"
          >
            캡슐을 생성할까요?
          </h2>
          <p className="text-xs leading-[1.6] text-ink-muted">
            한번 만든 캡슐은 고칠 수 없어요.
            <br />
            입력한 내용을 한 번 더 확인해 주세요.
          </p>
        </div>

        <dl className="flex flex-col gap-2 rounded-card bg-surface-muted px-3.5 py-3">
          <SummaryRow label="제목" value={values.title} />
          {/* 고른 날짜를 그대로 되읽어 준다. writeUntilDisplayDate 는 저장값(+1일)용이다. */}
          <SummaryRow
            label="작성 마감일"
            value={formatKstDate(kstDateStringToUtc(values.writeUntil))}
          />
          <SummaryRow
            label="공개일"
            value={formatKstDate(kstDateStringToUtc(values.openAt))}
          />
        </dl>

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
            className="h-control flex-1 rounded-button bg-accent text-sm font-semibold text-bg"
          >
            생성
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-ink-dim">{label}</dt>
      <dd className="truncate text-sm text-ink">{value}</dd>
    </div>
  );
}
