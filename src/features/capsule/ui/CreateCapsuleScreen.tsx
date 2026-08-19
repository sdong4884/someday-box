"use client";

import { CreateCapsuleForm } from "@/features/capsule/ui/CreateCapsuleForm";
import {
  DATE_INPUT_CLASS,
  Field,
  INPUT_CLASS,
  ScreenHeader,
  fieldAria,
} from "@/features/capsule/ui/formParts";
import { useNow } from "@/shared/time/useNow";

/**
 * `/new` 의 본체. 시각이 준비될 때까지의 화면을 맡는다.
 *
 * `useNow()` 는 마운트 전 null 이다 — NowProvider 의 서버 스냅샷이 null 이라 서버 HTML 과
 * 첫 클라이언트 렌더가 완전히 같아지고, 그래서 하이드레이션 불일치가 없다
 * (shared/time/nowStore.ts).
 *
 * 그동안 아무것도 안 그리면(DevTimeTravel 의 `if (!now) return null` 방식) 페이지 전체가
 * 한 프레임 비고, 카카오톡 인앱 브라우저에서는 그 깜빡임이 그대로 보인다. 그래서 시각 없이
 * 그릴 수 있는 것 — 헤더·라벨·안내문·빈 입력창 — 은 서버에서 그대로 그리고, 시각이 필요한
 * 것(달력의 하한, 검증 스키마, 제출)만 마운트 이후로 미룬다. 뼈대가 같아 교체 시점에
 * 레이아웃이 튀지 않는다.
 */
export function CreateCapsuleScreen() {
  const now = useNow();

  if (!now) return <CreateCapsuleShell />;

  return <CreateCapsuleForm now={now} />;
}

/** 시각이 오기 전의 정지 화면. 생김새는 폼과 같고 손댈 수만 없다. */
function CreateCapsuleShell() {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader submitLabel="생성" submitDisabled />

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
          <input
            {...fieldAria({
              id: "writeUntil-shell",
              hint: "이 날짜까지만 편지를 남길 수 있어요.",
            })}
            type="date"
            className={DATE_INPUT_CLASS}
            disabled
          />
        </Field>

        <Field
          id="openAt-shell"
          label="공개일"
          hint="공개일이 되면 모든 편지가 한번에 열려요."
        >
          <input
            {...fieldAria({
              id: "openAt-shell",
              hint: "공개일이 되면 모든 편지가 한번에 열려요.",
            })}
            type="date"
            className={DATE_INPUT_CLASS}
            disabled
          />
        </Field>
      </div>
    </div>
  );
}
