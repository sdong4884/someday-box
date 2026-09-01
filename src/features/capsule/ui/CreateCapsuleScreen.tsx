"use client";

import { CreateCapsuleForm } from "@/features/capsule/ui/CreateCapsuleForm";
import {
  DateInput,
  Field,
  INPUT_CLASS,
  ScreenHeader,
  fieldAria,
} from "@/shared/ui/formParts";
import { useNow } from "@/shared/time/useNow";

/**
 * 마운트 전 null 인 동안 아무것도 안 그리면 페이지가 한 프레임 비고, 카카오톡 인앱
 * 브라우저에서는 그 깜빡임이 그대로 보인다. 그래서 뼈대만 먼저 그린다
 * (shared/time/nowStore.ts).
 */
export function CreateCapsuleScreen() {
  const now = useNow();

  if (!now) return <CreateCapsuleShell />;

  return <CreateCapsuleForm now={now} />;
}

function CreateCapsuleShell() {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="새 캡슐" submitLabel="생성" submitDisabled />

      <div className="flex flex-col gap-6 px-5 py-6">
        <Field id="title-shell" label="캡슐 제목">
          <input
            {...fieldAria({ id: "title-shell" })}
            type="text"
            placeholder="예: 2027년, 우리에게"
            className={INPUT_CLASS}
            disabled
          />
        </Field>

        <Field
          id="writeUntil-shell"
          label="작성 마감일"
          hint="이 날짜까지만 편지를 남길 수 있어요."
        >
          <DateInput
            {...fieldAria({
              id: "writeUntil-shell",
              hint: "이 날짜까지만 편지를 남길 수 있어요.",
            })}
            disabled
            isEmpty
          />
        </Field>

        <Field
          id="openAt-shell"
          label="공개일"
          hint="공개일이 되면 모든 편지가 한번에 열려요."
        >
          <DateInput
            {...fieldAria({
              id: "openAt-shell",
              hint: "공개일이 되면 모든 편지가 한번에 열려요.",
            })}
            disabled
            isEmpty
          />
        </Field>
      </div>
    </div>
  );
}
