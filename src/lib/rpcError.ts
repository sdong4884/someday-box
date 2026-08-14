/**
 * RPC 실패를 사람이 읽는 문구로 바꾸는 유일한 지점.
 *
 * RPC 들은 실패를 앱 전용 SQLSTATE 로 알린다. 코드가 어떤 조건에 붙는지는 각
 * 마이그레이션의 헤더 주석에 있다.
 * - SB001~SB005 : 편지 (20260811005629_letter_write_rpc.sql)
 * - SB006~SB010 : 캡슐 생성 (20260814112913_capsule_create_error_codes.sql)
 *
 * DB 함수도 한국어 message 를 담아 raise 하지만 그 문구를 그대로 쓰지 않는다.
 * UI 문구가 마이그레이션에 묶이면 문구 하나 고치는 데 마이그레이션이 필요해진다.
 *
 * 캡슐 생성 폼(createCapsuleSchema)이 SB006~SB010 과 같은 규칙을 먼저 거르므로 이
 * 문구들은 폼을 지나친 요청에만 보인다. 그래서 필드 옆 문구가 아니라 토스트에 그대로
 * 띄울 수 있는 완결된 문장으로 쓴다.
 */

export const SB_ERROR_MESSAGES = {
  SB001: "캡슐을 찾을 수 없습니다. 링크를 다시 확인해 주세요.",
  SB002: "닉네임 또는 비밀번호가 일치하지 않습니다.",
  SB003: "편지 입력 기간이 끝났습니다.",
  SB004: "이미 사용 중인 닉네임입니다. 다른 닉네임을 써 주세요.",
  SB005: "비밀번호를 다시 확인해 주세요.",
  SB006: "제목은 1~20자로 입력해 주세요.",
  SB007: "입력 마감일이 이미 지난 날짜입니다. 다시 정해 주세요.",
  SB008: "만료일은 입력 마감일보다 뒤여야 합니다.",
  SB009: "만료일은 10년 이내로 정해 주세요.",
  SB010: "만료일이 이미 지난 날짜입니다. 다시 정해 주세요.",
} as const;

export type SbErrorCode = keyof typeof SB_ERROR_MESSAGES;

export const FALLBACK_ERROR_MESSAGE =
  "문제가 생겼습니다. 잠시 후 다시 시도해 주세요.";

type ResponseError = { code: string; message?: string };

/**
 * PostgREST 가 응답으로 돌려준 에러인지. `code` 를 가진 객체면 서버가 답을 준 것이다
 * (PostgrestError 는 code/message/details/hint 를 갖는다).
 */
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

/**
 * 재시도가 의미 있는 에러인지.
 *
 * 서버가 답을 준 이상 같은 요청을 다시 보내도 같은 답이 온다 — SB001~SB005 도,
 * 42501(권한 없음)도, PGRST*(스키마 캐시)도 마찬가지다. 재시도가 뜻이 있는 건
 * 네트워크가 끊겨 응답 자체가 없을 때뿐이다.
 */
export function isRetriableError(error: unknown): boolean {
  return !isResponseError(error);
}

export function getRpcErrorMessage(error: unknown): string {
  if (!isResponseError(error)) return FALLBACK_ERROR_MESSAGE;

  return isSbErrorCode(error.code)
    ? SB_ERROR_MESSAGES[error.code]
    : FALLBACK_ERROR_MESSAGE;
}
