import { describe, expect, it } from "vitest";

import {
  createLetterSchema,
  LETTER_CONTENT_MAX_LENGTH,
  LETTER_FORM_MESSAGES as MESSAGES,
} from "@/features/letter/model/createLetterSchema";
import {
  UNLOCK_PASSWORD_REQUIRED,
  unlockLetterSchema,
  updateLetterSchema,
} from "@/features/letter/model/updateLetterSchema";

const repeat = (count: number, char = "가") => char.repeat(count);

const parse = (content: string) => updateLetterSchema.safeParse({ content });
const errorOf = (content: string) => parse(content).error?.issues[0]?.message;

describe("updateLetterSchema", () => {
  it("내용만 받는다", () => {
    const result = parse("고친 편지");

    expect(result.success).toBe(true);
    expect(Object.keys(result.data ?? {})).toEqual(["content"]);
  });

  it("닉네임·비밀번호를 넣어도 결과에 남지 않는다", () => {
    const result = updateLetterSchema.safeParse({
      content: "고친 편지",
      nickname: "진호",
      password: "test1234",
    });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("nickname");
    expect(result.data).not.toHaveProperty("password");
  });

  it("닉네임·비밀번호가 없어도 통과한다", () => {
    expect(parse("고친 편지").success).toBe(true);
  });

  describe("내용 규칙은 createLetterSchema 와 같다", () => {
    it("빈 값을 거부한다", () => {
      expect(errorOf("")).toBe(MESSAGES.contentRequired);
    });

    it("공백뿐이면 거부한다", () => {
      expect(errorOf("  \n  ")).toBe(MESSAGES.contentRequired);
    });

    it(`${LETTER_CONTENT_MAX_LENGTH}자면 통과한다`, () => {
      expect(parse(repeat(LETTER_CONTENT_MAX_LENGTH)).success).toBe(true);
    });

    it(`${LETTER_CONTENT_MAX_LENGTH + 1}자는 거부한다`, () => {
      expect(errorOf(repeat(LETTER_CONTENT_MAX_LENGTH + 1))).toBe(
        MESSAGES.contentTooLong,
      );
    });

    it("앞뒤 공백을 깎아 돌려준다", () => {
      expect(parse("\n안녕\n").data?.content).toBe("안녕");
    });

    // pick 으로 뽑았으므로 두 스키마의 판정이 갈릴 수 없다.
    it.each(["", "  ", "안녕", repeat(LETTER_CONTENT_MAX_LENGTH + 1)])(
      "%s 에 대해 두 스키마가 같은 결론을 낸다",
      (content) => {
        const created = createLetterSchema.safeParse({
          nickname: "진호",
          password: "test1234",
          content,
        });

        expect(parse(content).success).toBe(created.success);
      },
    );
  });
});

describe("unlockLetterSchema", () => {
  it("빈 비밀번호를 거부한다", () => {
    expect(
      unlockLetterSchema.safeParse({ password: "" }).error?.issues[0]?.message,
    ).toBe(UNLOCK_PASSWORD_REQUIRED);
  });

  /*
   * 길이를 보지 않는다는 것. T13 이전에 만들어진 짧은 비밀번호도 열 수 있어야 한다.
   */
  it.each(["1", "abc", " ", "a".repeat(50)])("%s 를 통과시킨다", (password) => {
    expect(unlockLetterSchema.safeParse({ password }).success).toBe(true);
  });
});
