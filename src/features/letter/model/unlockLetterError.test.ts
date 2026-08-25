import { describe, expect, it } from "vitest";

import { toUnlockLetterFieldError } from "@/features/letter/model/unlockLetterError";
import { SB_ERROR_MESSAGES } from "@/lib/rpcError";

describe("toUnlockLetterFieldError", () => {
  it("인증 실패(SB002)를 비밀번호 칸에 붙인다", () => {
    expect(toUnlockLetterFieldError({ code: "SB002" })).toEqual({
      field: "password",
      message: SB_ERROR_MESSAGES.SB002,
    });
  });

  it.each(["SB001", "SB003", "SB004", "SB005"])(
    "%s 는 붙일 칸이 없어 null 이다 — 호출부가 토스트로 보낸다",
    (code) => {
      expect(toUnlockLetterFieldError({ code })).toBeNull();
    },
  );

  it("캡슐 생성 코드는 이 모달의 칸이 아니다", () => {
    expect(toUnlockLetterFieldError({ code: "SB006" })).toBeNull();
  });

  it.each([
    ["42501", "권한 없음"],
    ["PGRST202", "스키마 캐시"],
  ])("%s 는 null 이다 (%s)", (code) => {
    expect(toUnlockLetterFieldError({ code })).toBeNull();
  });

  it.each([
    ["응답 없는 네트워크 에러", new Error("network")],
    ["null", null],
    ["undefined", undefined],
    ["code 가 없는 객체", { message: "code 없음" }],
  ])("%s 는 null 이다", (_label, error) => {
    expect(toUnlockLetterFieldError(error)).toBeNull();
  });
});
