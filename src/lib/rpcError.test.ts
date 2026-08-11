import { describe, expect, it } from "vitest";

import {
  FALLBACK_ERROR_MESSAGE,
  SB_ERROR_MESSAGES,
  getRpcErrorMessage,
  isResponseError,
  isRetriableError,
} from "@/lib/rpcError";

describe("getRpcErrorMessage", () => {
  it("SB001~SB005 를 각각 다른 문구로 바꾼다", () => {
    const codes = ["SB001", "SB002", "SB003", "SB004", "SB005"] as const;

    for (const code of codes) {
      expect(getRpcErrorMessage({ code })).toBe(SB_ERROR_MESSAGES[code]);
    }

    const messages = codes.map((code) => SB_ERROR_MESSAGES[code]);
    expect(new Set(messages).size).toBe(codes.length);
  });

  it("모르는 코드는 기본 문구다", () => {
    for (const code of ["42501", "PGRST202", "P0001", "SB999"]) {
      expect(getRpcErrorMessage({ code })).toBe(FALLBACK_ERROR_MESSAGE);
    }
  });

  it("비정형 입력도 기본 문구로 떨어진다", () => {
    for (const error of [
      null,
      undefined,
      "SB001",
      42501,
      new Error("boom"),
      { message: "code 가 없다" },
      { code: 500 },
    ]) {
      expect(getRpcErrorMessage(error)).toBe(FALLBACK_ERROR_MESSAGE);
    }
  });

  it("DB 가 담아 보낸 message 를 쓰지 않는다", () => {
    const fromDb = { code: "SB003", message: "편지 수정 기간이 끝났습니다." };

    expect(getRpcErrorMessage(fromDb)).toBe(SB_ERROR_MESSAGES.SB003);
    expect(getRpcErrorMessage(fromDb)).not.toBe(fromDb.message);
  });
});

describe("isResponseError", () => {
  it("code 가 문자열인 객체만 서버 응답으로 본다", () => {
    expect(isResponseError({ code: "SB001" })).toBe(true);
    expect(isResponseError({ code: 500 })).toBe(false);
    expect(isResponseError(new TypeError("fetch failed"))).toBe(false);
    expect(isResponseError(null)).toBe(false);
  });
});

describe("isRetriableError", () => {
  it("서버가 답을 준 에러는 재시도하지 않는다", () => {
    for (const code of ["SB001", "SB003", "42501", "PGRST202"]) {
      expect(isRetriableError({ code })).toBe(false);
    }
  });

  it("응답이 없는 네트워크 실패는 재시도한다", () => {
    expect(isRetriableError(new TypeError("fetch failed"))).toBe(true);
    expect(isRetriableError(new Error("timeout"))).toBe(true);
  });
});
