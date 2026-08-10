import { describe, expect, it } from "vitest";

import {
  CAPSULE_PUBLIC_COLUMNS,
  CAPSULE_PUBLIC_COLUMN_KEYS,
  LETTER_PUBLIC_COLUMNS,
  LETTER_PUBLIC_COLUMN_KEYS,
} from "@/lib/dbColumns";

describe("공개 컬럼 상수", () => {
  it("capsules 의 리터럴과 키 배열이 일치한다", () => {
    expect(CAPSULE_PUBLIC_COLUMNS).toBe(CAPSULE_PUBLIC_COLUMN_KEYS.join(", "));
  });

  it("letters 의 리터럴과 키 배열이 일치한다", () => {
    expect(LETTER_PUBLIC_COLUMNS).toBe(LETTER_PUBLIC_COLUMN_KEYS.join(", "));
  });

  it("해시 컬럼을 포함하지 않는다", () => {
    for (const columns of [CAPSULE_PUBLIC_COLUMNS, LETTER_PUBLIC_COLUMNS]) {
      expect(columns).not.toContain("password_hash");
    }
  });

  it("`*` 를 쓰지 않는다", () => {
    for (const columns of [CAPSULE_PUBLIC_COLUMNS, LETTER_PUBLIC_COLUMNS]) {
      expect(columns).not.toContain("*");
    }
  });
});
