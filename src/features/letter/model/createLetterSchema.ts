import { z } from "zod";

// DB CHECK 는 닉네임 20자, 내용 2000자다. 더 좁게만 잡는다.
export const LETTER_NICKNAME_MAX_LENGTH = 10;
export const LETTER_CONTENT_MAX_LENGTH = 1000;
export const LETTER_PASSWORD_MIN_LENGTH = 4;
export const LETTER_PASSWORD_MAX_LENGTH = 20;

// SB005 의 상한. 바이트 검사는 두지 않는다 — 글자 수 상한이 이미 이 값을 보장한다.
export const LETTER_PASSWORD_MAX_BYTES = 72;

export const MAX_UTF8_BYTES_PER_UNIT = 3;

export const LETTER_FORM_MESSAGES = {
  nicknameRequired: "닉네임을 입력해 주세요.",
  nicknameTooLong: `닉네임은 ${LETTER_NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요.`,
  passwordTooShort: `비밀번호는 ${LETTER_PASSWORD_MIN_LENGTH}자 이상이어야 해요.`,
  passwordTooLong: `비밀번호는 ${LETTER_PASSWORD_MAX_LENGTH}자까지 쓸 수 있어요.`,
  contentRequired: "내용을 입력해 주세요.",
  contentTooLong: `내용은 ${LETTER_CONTENT_MAX_LENGTH}자까지 쓸 수 있어요.`,
} as const;

export const createLetterSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, { error: LETTER_FORM_MESSAGES.nicknameRequired })
    .max(LETTER_NICKNAME_MAX_LENGTH, {
      error: LETTER_FORM_MESSAGES.nicknameTooLong,
    }),

  // 트림하지 않는다 — create_letter 가 받은 값을 그대로 crypt() 에 넘긴다.
  password: z
    .string()
    .min(LETTER_PASSWORD_MIN_LENGTH, {
      error: LETTER_FORM_MESSAGES.passwordTooShort,
    })
    .max(LETTER_PASSWORD_MAX_LENGTH, {
      error: LETTER_FORM_MESSAGES.passwordTooLong,
    }),

  content: z
    .string()
    .trim()
    .min(1, { error: LETTER_FORM_MESSAGES.contentRequired })
    .max(LETTER_CONTENT_MAX_LENGTH, {
      error: LETTER_FORM_MESSAGES.contentTooLong,
    }),
});

export type CreateLetterInput = z.infer<typeof createLetterSchema>;
