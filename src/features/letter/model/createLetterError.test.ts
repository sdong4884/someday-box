import { describe, expect, it } from "vitest";

import { toCreateLetterFieldError } from "@/features/letter/model/createLetterError";
import { SB_ERROR_MESSAGES } from "@/lib/rpcError";

describe("toCreateLetterFieldError", () => {
  it("닉네임 중복(SB004)을 닉네임 칸에 붙인다", () => {
    expect(toCreateLetterFieldError({ code: "SB004" })).toEqual({
      field: "nickname",
      message: SB_ERROR_MESSAGES.SB004,
    });
  });

  it("문구는 rpcError 의 것을 그대로 쓴다", () => {
    expect(toCreateLetterFieldError({ code: "SB004" })?.message).toBe(
      SB_ERROR_MESSAGES.SB004,
    );
  });

  it.each(["SB001", "SB002", "SB003", "SB005"])(
    "%s 는 붙일 칸이 없어 null 이다 — 호출부가 토스트로 보낸다",
    (code) => {
      expect(toCreateLetterFieldError({ code })).toBeNull();
    },
  );

  it("캡슐 생성 코드는 이 폼의 칸이 아니다", () => {
    expect(toCreateLetterFieldError({ code: "SB006" })).toBeNull();
  });

  it.each([
    ["42501", "권한 없음"],
    ["PGRST202", "스키마 캐시"],
  ])("%s 는 null 이다 (%s)", (code) => {
    expect(toCreateLetterFieldError({ code })).toBeNull();
  });

  it.each([
    ["응답 없는 네트워크 에러", new Error("network")],
    ["null", null],
    ["undefined", undefined],
    ["code 가 없는 객체", { message: "code 없음" }],
  ])("%s 는 null 이다", (_label, error) => {
    expect(toCreateLetterFieldError(error)).toBeNull();
  });
});
