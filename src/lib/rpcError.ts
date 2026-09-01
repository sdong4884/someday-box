/**
 * 실패 문구를 내는 유일한 지점. 각 코드가 어떤 조건에 붙는지는 마이그레이션 헤더에 있다.
 * - SB001~SB005 : 편지 (20260811005629_letter_write_rpc.sql)
 * - SB006~SB010 : 캡슐 생성 (20260814112913_capsule_create_error_codes.sql)
 *
 * DB 가 담아 보내는 message 를 쓰지 않는다 — UI 문구가 마이그레이션에 묶인다.
 */

export const SB_ERROR_MESSAGES = {
  SB001: "캡슐을 찾을 수 없습니다. 링크를 다시 확인해 주세요.",
  SB002: "닉네임 또는 비밀번호가 일치하지 않습니다.",
  SB003: "편지 입력 기간이 끝났습니다.",
  SB004: "이미 사용 중인 닉네임입니다. 다른 닉네임을 써 주세요.",
  SB005: "비밀번호를 다시 확인해 주세요.",
  SB006: "제목은 1~20자로 입력해 주세요.",
  SB007: "작성 마감일이 이미 지난 날짜입니다. 다시 정해 주세요.",
  SB008: "공개일은 작성 마감일보다 뒤여야 합니다.",
  SB009: "공개일은 10년 이내로 정해 주세요.",
  SB010: "공개일이 이미 지난 날짜입니다. 다시 정해 주세요.",
} as const;

export type SbErrorCode = keyof typeof SB_ERROR_MESSAGES;

export const FALLBACK_ERROR_MESSAGE =
  "문제가 생겼습니다. 잠시 후 다시 시도해 주세요.";

type ResponseError = { code: string; message?: string };

/** `code` 를 가진 객체면 서버가 답을 준 것이다 (PostgrestError 는 code 를 갖는다). */
export function isResponseError(error: unknown): error is ResponseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

export function isSbErrorCode(code: string): code is SbErrorCode {
  return code in SB_ERROR_MESSAGES;
}

/** 서버가 답을 준 이상 다시 보내도 같은 답이 온다. 재시도는 응답 자체가 없을 때만 뜻이 있다. */
export function isRetriableError(error: unknown): boolean {
  return !isResponseError(error);
}

export function getRpcErrorMessage(error: unknown): string {
  if (!isResponseError(error)) return FALLBACK_ERROR_MESSAGE;

  return isSbErrorCode(error.code)
    ? SB_ERROR_MESSAGES[error.code]
    : FALLBACK_ERROR_MESSAGE;
}
