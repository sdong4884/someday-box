import { describe, expect, it } from "vitest";

import {
  createLetterSchema,
  LETTER_CONTENT_MAX_LENGTH,
  LETTER_FORM_MESSAGES as MESSAGES,
  LETTER_NICKNAME_MAX_LENGTH,
  LETTER_PASSWORD_MAX_BYTES,
  LETTER_PASSWORD_MAX_LENGTH,
  LETTER_PASSWORD_MIN_LENGTH,
  MAX_UTF8_BYTES_PER_UNIT,
  type CreateLetterInput,
} from "@/features/letter/model/createLetterSchema";

const VALID: CreateLetterInput = {
  nickname: "진호",
  password: "test1234",
  content: "10년 뒤에도 잘 지내고 있길.",
};

const parse = (patch: Partial<CreateLetterInput>) =>
  createLetterSchema.safeParse({ ...VALID, ...patch });

/** 첫 이슈의 문구. 통과했으면 undefined. */
const errorOf = (patch: Partial<CreateLetterInput>) =>
  parse(patch).error?.issues[0]?.message;

const repeat = (count: number, char = "가") => char.repeat(count);

describe("createLetterSchema", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(parse({}).success).toBe(true);
  });

  describe("nickname", () => {
    it("1자면 통과한다", () => {
      expect(parse({ nickname: "하" }).success).toBe(true);
    });

    it(`${LETTER_NICKNAME_MAX_LENGTH}자면 통과한다`, () => {
      expect(
        parse({ nickname: repeat(LETTER_NICKNAME_MAX_LENGTH) }).success,
      ).toBe(true);
    });

    it(`${LETTER_NICKNAME_MAX_LENGTH + 1}자는 거부한다`, () => {
      expect(errorOf({ nickname: repeat(LETTER_NICKNAME_MAX_LENGTH + 1) })).toBe(
        MESSAGES.nicknameTooLong,
      );
    });

    it("빈 값을 거부한다", () => {
      expect(errorOf({ nickname: "" })).toBe(MESSAGES.nicknameRequired);
    });

    it("공백뿐이면 거부한다 — DB 의 char_length(btrim(...)) 과 같은 기준", () => {
      expect(errorOf({ nickname: "   " })).toBe(MESSAGES.nicknameRequired);
    });

    it("앞뒤 공백을 깎아 통과시키고, 깎인 값을 돌려준다", () => {
      const result = parse({ nickname: " 진호 " });

      expect(result.success).toBe(true);
      expect(result.data?.nickname).toBe("진호");
    });

    it("공백을 깎으면 상한 안에 드는 값은 통과한다", () => {
      const padded = ` ${repeat(LETTER_NICKNAME_MAX_LENGTH)} `;

      expect(parse({ nickname: padded }).success).toBe(true);
    });
  });

  describe("password", () => {
    it(`${LETTER_PASSWORD_MIN_LENGTH}자면 통과한다`, () => {
      expect(parse({ password: "1234" }).success).toBe(true);
    });

    it(`${LETTER_PASSWORD_MIN_LENGTH - 1}자는 거부한다`, () => {
      expect(errorOf({ password: "123" })).toBe(MESSAGES.passwordTooShort);
    });

    it(`${LETTER_PASSWORD_MAX_LENGTH}자면 통과한다`, () => {
      expect(parse({ password: "a".repeat(LETTER_PASSWORD_MAX_LENGTH) }).success).toBe(
        true,
      );
    });

    it(`${LETTER_PASSWORD_MAX_LENGTH + 1}자는 거부한다`, () => {
      expect(
        errorOf({ password: "a".repeat(LETTER_PASSWORD_MAX_LENGTH + 1) }),
      ).toBe(MESSAGES.passwordTooLong);
    });

    it("한글 20자는 60바이트라 통과한다", () => {
      expect(parse({ password: repeat(LETTER_PASSWORD_MAX_LENGTH) }).success).toBe(
        true,
      );
    });

    // 이모지는 한 자가 UTF-16 2단위라 글자 수 검사에 먼저 걸린다.
    it("이모지 20자는 길이 40 이라 길이 문구로 거부된다", () => {
      expect(errorOf({ password: "🌙".repeat(20) })).toBe(MESSAGES.passwordTooLong);
    });

    // 상한을 올려 이 전제가 깨지면 여기서 먼저 걸린다.
    it("글자 수 상한이 72바이트 상한을 보장한다", () => {
      expect(LETTER_PASSWORD_MAX_LENGTH * MAX_UTF8_BYTES_PER_UNIT).toBeLessThanOrEqual(
        LETTER_PASSWORD_MAX_BYTES,
      );
    });

    it("실제로 가장 무거운 20자도 72바이트를 넘지 않는다", () => {
      const heaviest = "힣".repeat(LETTER_PASSWORD_MAX_LENGTH);

      expect(new TextEncoder().encode(heaviest).length).toBeLessThanOrEqual(
        LETTER_PASSWORD_MAX_BYTES,
      );
      expect(parse({ password: heaviest }).success).toBe(true);
    });

    // crypt() 에 넘기는 원문이 사용자가 친 값과 같아야 한다.
    it("공백을 깎지 않는다", () => {
      const result = parse({ password: " 1234 " });

      expect(result.success).toBe(true);
      expect(result.data?.password).toBe(" 1234 ");
    });

    it("공백만 4자여도 통과한다 — 깎지 않으므로", () => {
      expect(parse({ password: "    " }).success).toBe(true);
    });
  });

  describe("content", () => {
    it("1자면 통과한다", () => {
      expect(parse({ content: "응" }).success).toBe(true);
    });

    it(`${LETTER_CONTENT_MAX_LENGTH}자면 통과한다`, () => {
      expect(parse({ content: repeat(LETTER_CONTENT_MAX_LENGTH) }).success).toBe(
        true,
      );
    });

    it(`${LETTER_CONTENT_MAX_LENGTH + 1}자는 거부한다`, () => {
      expect(errorOf({ content: repeat(LETTER_CONTENT_MAX_LENGTH + 1) })).toBe(
        MESSAGES.contentTooLong,
      );
    });

    it("빈 값을 거부한다", () => {
      expect(errorOf({ content: "" })).toBe(MESSAGES.contentRequired);
    });

    it("공백·줄바꿈뿐이면 거부한다", () => {
      expect(errorOf({ content: "  \n\n  " })).toBe(MESSAGES.contentRequired);
    });

    it("앞뒤 공백을 깎아 돌려준다", () => {
      const result = parse({ content: "\n안녕\n" });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("안녕");
    });
  });

  // 폼이 DB 보다 엄격한 쪽이어야 한다. 반대면 통과시킨 값을 DB 가 거부한다.
  it("닉네임·내용 상한이 DB CHECK 보다 좁다", () => {
    expect(LETTER_NICKNAME_MAX_LENGTH).toBeLessThanOrEqual(20);
    expect(LETTER_CONTENT_MAX_LENGTH).toBeLessThanOrEqual(2000);
  });
});
