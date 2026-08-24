import {
  getRpcErrorMessage,
  isResponseError,
  isSbErrorCode,
  type SbErrorCode,
} from "@/lib/rpcError";

import type { CreateLetterInput } from "./createLetterSchema";

export type CreateLetterField = keyof CreateLetterInput;

export type CreateLetterFieldError = {
  field: CreateLetterField;
  message: string;
};

// 닉네임 중복만 붙는다 — 폼이 고쳐서 다시 낼 수 있는 유일한 실패다.
const FIELD_BY_CODE = {
  SB004: "nickname",
} as const satisfies Partial<Record<SbErrorCode, CreateLetterField>>;

function isMappedCode(code: SbErrorCode): code is keyof typeof FIELD_BY_CODE {
  return code in FIELD_BY_CODE;
}

export function toCreateLetterFieldError(
  error: unknown,
): CreateLetterFieldError | null {
  if (!isResponseError(error)) return null;
  if (!isSbErrorCode(error.code) || !isMappedCode(error.code)) return null;

  return {
    field: FIELD_BY_CODE[error.code],
    message: getRpcErrorMessage(error),
  };
}
