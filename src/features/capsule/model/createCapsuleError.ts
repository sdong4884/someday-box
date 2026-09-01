import {
  getRpcErrorMessage,
  isResponseError,
  isSbErrorCode,
  type SbErrorCode,
} from "@/lib/rpcError";

import type { CreateCapsuleInput } from "./createCapsuleSchema";

/**
 * 여기는 **칸만** 안다. 문구를 다시 쓰면 같은 실패가 토스트와 필드에서 다른 말을 한다.
 */

export type CreateCapsuleField = keyof CreateCapsuleInput;

export type CreateCapsuleFieldError = {
  field: CreateCapsuleField;
  message: string;
};

/** `satisfies` 덕분에 스키마의 필드 이름이 바뀌면 여기서 컴파일이 깨진다. */
const FIELD_BY_CODE = {
  SB006: "title",
  SB007: "writeUntil",
  SB008: "openAt",
  SB009: "openAt",
  SB010: "openAt",
} as const satisfies Partial<Record<SbErrorCode, CreateCapsuleField>>;

function isMappedCode(code: SbErrorCode): code is keyof typeof FIELD_BY_CODE {
  return code in FIELD_BY_CODE;
}

/** `null` 은 "이 폼이 고칠 수 없는 실패" 다 — 호출부가 토스트로 보낸다. */
export function toCreateCapsuleFieldError(
  error: unknown,
): CreateCapsuleFieldError | null {
  if (!isResponseError(error)) return null;
  if (!isSbErrorCode(error.code) || !isMappedCode(error.code)) return null;

  return {
    field: FIELD_BY_CODE[error.code],
    message: getRpcErrorMessage(error),
  };
}
