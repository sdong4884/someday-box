import { z } from "zod";

import { createLetterSchema } from "@/features/letter/model/createLetterSchema";

// 닉네임·비밀번호는 readonly 라 검증할 것이 없다. 규칙은 createLetterSchema 하나에만 둔다.
export const updateLetterSchema = createLetterSchema.pick({ content: true });

export type UpdateLetterInput = z.infer<typeof updateLetterSchema>;

export const UNLOCK_PASSWORD_REQUIRED = "비밀번호를 입력해 주세요.";

/*
 * 길이는 보지 않는다. 4~20자 규칙은 T13 에서 생긴 것이라 그 전에 만들어진 편지는 더 짧을
 * 수 있고, 폼이 먼저 막으면 정작 본인이 못 여는 편지가 생긴다. 판정은 서버 SB002 가 한다.
 */
export const unlockLetterSchema = z.object({
  password: z.string().min(1, { error: UNLOCK_PASSWORD_REQUIRED }),
});

export type UnlockLetterInput = z.infer<typeof unlockLetterSchema>;
