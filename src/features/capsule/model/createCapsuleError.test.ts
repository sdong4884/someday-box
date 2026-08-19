import { describe, expect, it } from "vitest";

import { toCreateCapsuleFieldError } from "@/features/capsule/model/createCapsuleError";
import { SB_ERROR_MESSAGES } from "@/lib/rpcError";

describe("toCreateCapsuleFieldError", () => {
  it("캡슐 생성 코드를 해당 칸에 붙인다", () => {
    const cases = [
      { code: "SB006", field: "title" },
      { code: "SB007", field: "writeUntil" },
      { code: "SB008", field: "openAt" },
      { code: "SB009", field: "openAt" },
      { code: "SB010", field: "openAt" },
    ] as const;

    for (const { code, field } of cases) {
      expect(toCreateCapsuleFieldError({ code })).toEqual({
        field,
        message: SB_ERROR_MESSAGES[code],
      });
    }
  });

  it("두 날짜의 과거 검사가 서로 다른 칸으로 갈린다", () => {
    // 이 구분을 만들려고 20260814112913 에서 SB007 을 쪼갰다.
    const writeUntil = toCreateCapsuleFieldError({ code: "SB007" });
    const openAt = toCreateCapsuleFieldError({ code: "SB010" });

    expect(writeUntil?.field).toBe("writeUntil");
    expect(openAt?.field).toBe("openAt");
    expect(writeUntil?.message).not.toBe(openAt?.message);
  });

  it("편지 코드는 붙일 칸이 없다", () => {
    for (const code of ["SB001", "SB002", "SB003", "SB004", "SB005"]) {
      expect(toCreateCapsuleFieldError({ code })).toBeNull();
    }
  });

  it("폼이 고칠 수 없는 실패는 null 이다", () => {
    for (const code of ["42501", "PGRST202", "23502", "P0001", "SB999"]) {
      expect(toCreateCapsuleFieldError({ code })).toBeNull();
    }
  });

  it("응답이 아닌 에러도 null 이다", () => {
    for (const error of [
      null,
      undefined,
      new TypeError("fetch failed"),
      "SB006",
      { message: "code 가 없다" },
      { code: 500 },
    ]) {
      expect(toCreateCapsuleFieldError(error)).toBeNull();
    }
  });

  it("문구는 rpcError 의 것을 그대로 쓴다", () => {
    const fromDb = { code: "SB006", message: "제목은 1~20자여야 합니다." };

    expect(toCreateCapsuleFieldError(fromDb)?.message).toBe(
      SB_ERROR_MESSAGES.SB006,
    );
    expect(toCreateCapsuleFieldError(fromDb)?.message).not.toBe(fromDb.message);
  });
});
