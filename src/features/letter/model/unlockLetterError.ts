import {
  getRpcErrorMessage,
  isResponseError,
  isSbErrorCode,
  type SbErrorCode,
} from "@/lib/rpcError";

import type { UnlockLetterInput } from "./updateLetterSchema";

export type UnlockLetterField = keyof UnlockLetterInput;

export type UnlockLetterFieldError = {
  field: UnlockLetterField;
  message: string;
};

// 인증 실패만 칸에 붙는다 — 모달이 고쳐서 다시 낼 수 있는 유일한 실패다.
const FIELD_BY_CODE = {
  SB002: "password",
} as const satisfies Partial<Record<SbErrorCode, UnlockLetterField>>;

function isMappedCode(code: SbErrorCode): code is keyof typeof FIELD_BY_CODE {
  return code in FIELD_BY_CODE;
}

export function toUnlockLetterFieldError(
  error: unknown,
): UnlockLetterFieldError | null {
  if (!isResponseError(error)) return null;
  if (!isSbErrorCode(error.code) || !isMappedCode(error.code)) return null;

  return {
    field: FIELD_BY_CODE[error.code],
    message: getRpcErrorMessage(error),
  };
}
