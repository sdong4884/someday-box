import {
  getRpcErrorMessage,
  isResponseError,
  isSbErrorCode,
  type SbErrorCode,
} from "@/lib/rpcError";

import type { CreateCapsuleInput } from "./createCapsuleSchema";

/**
 * `create_capsule` 의 실패를 폼의 어느 칸에 붙일지 정하는 곳.
 *
 * 문구는 만들지 않는다 — `rpcError` 가 이미 코드마다 문구를 갖고 있으므로 그걸 가져다
 * 쓰고, 여기는 **칸만** 안다. 문구를 여기서 다시 쓰면 같은 실패가 토스트와 필드에서
 * 서로 다른 말을 하게 된다.
 *
 * 반대 방향(코드가 어떤 조건에 붙는지)은
 * supabase/migrations/20260814112913_capsule_create_error_codes.sql 헤더에 있다.
 */

export type CreateCapsuleField = keyof CreateCapsuleInput;

export type CreateCapsuleFieldError = {
  field: CreateCapsuleField;
  message: string;
};

/**
 * 캡슐 생성 코드만 담는다. SB001~SB005 는 편지 쪽이라 이 폼에 붙일 칸이 없다.
 *
 * `satisfies` 로 값이 실제 폼 필드 이름인지 검사한다. 스키마의 필드 이름이 바뀌면
 * 여기서 컴파일이 깨진다.
 */
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

/**
 * 특정 칸에 붙일 수 있는 실패면 `{ field, message }`, 아니면 `null`.
 *
 * `null` 은 "이 폼이 고칠 수 없는 실패"라는 뜻이다 — 권한(42501), 스키마 캐시(PGRST*),
 * 네트워크 끊김 모두 여기에 해당하고 호출부가 토스트로 보낸다.
 */
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
