"use client";

import Link from "next/link";

import { getCapsuleStatus } from "@/domain/capsule";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import {
  LETTER_CONTENT_MAX_LENGTH,
  LETTER_NICKNAME_MAX_LENGTH,
  LETTER_PASSWORD_MAX_LENGTH,
} from "@/features/letter/model/createLetterSchema";
import { CharCounter, InfoBanner } from "@/features/letter/ui/letterParts";
import {
  LOSS_WARNING,
  WriteLetterForm,
} from "@/features/letter/ui/WriteLetterForm";
import type { CapsulePublic } from "@/lib/dbColumns";
import { useNow } from "@/shared/time/useNow";
import {
  Field,
  INPUT_CLASS,
  ScreenHeader,
  TEXTAREA_CLASS,
  fieldAria,
} from "@/shared/ui/formParts";

export function WriteLetterScreen({ capsule }: { capsule: CapsulePublic }) {
  const now = useNow();

  /** 마운트 전 null. 이 분기를 지우면 서버 HTML 과 어긋난다 (shared/time/nowStore.ts). */
  if (!now) return <WriteLetterShell />;

  // 서버도 SB003 으로 막지만 그건 다 쓴 뒤라 본문을 잃는다. 화면이 먼저 막는다.
  if (getCapsuleStatus(getCapsulePeriod(capsule), now) !== "WRITING") {
    return <ClosedNotice slug={capsule.slug} />;
  }

  return <WriteLetterForm capsule={capsule} />;
}

function WriteLetterShell() {
  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="편지 쓰기" submitLabel="저장" submitDisabled />

      <div className="flex flex-col gap-6 px-5 py-6">
        <InfoBanner>{LOSS_WARNING}</InfoBanner>

        <Field id="nickname-shell" label="닉네임">
          <input
            {...fieldAria({ id: "nickname-shell" })}
            type="text"
            placeholder="편지에 표시돼요"
            maxLength={LETTER_NICKNAME_MAX_LENGTH}
            className={INPUT_CLASS}
            disabled
          />
        </Field>

        <Field id="password-shell" label="비밀번호">
          <input
            {...fieldAria({ id: "password-shell" })}
            type="password"
            placeholder="수정할 때 필요해요"
            maxLength={LETTER_PASSWORD_MAX_LENGTH}
            className={INPUT_CLASS}
            disabled
          />
        </Field>

        <Field id="content-shell" label="내용">
          <textarea
            {...fieldAria({ id: "content-shell" })}
            placeholder="마음을 담아 적어주세요"
            className={TEXTAREA_CLASS}
            disabled
          />
          <CharCounter length={0} max={LETTER_CONTENT_MAX_LENGTH} />
        </Field>
      </div>
    </div>
  );
}

function ClosedNotice({ slug }: { slug: string }) {
  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <div className="flex-1">
        <h1 className="mt-20 text-4xl font-bold tracking-[-0.01em] text-ink">
          작성 기간이 끝났어요
        </h1>
        <p className="mt-3.5 text-sm leading-[1.6] font-medium text-ink-muted">
          이제 편지를 남길 수 없어요.
        </p>
      </div>

      <Link
        href={`/c/${slug}`}
        className="flex h-cta w-full items-center justify-center rounded-button bg-accent text-base font-semibold text-bg"
      >
        캡슐로 돌아가기
      </Link>
    </div>
  );
}
