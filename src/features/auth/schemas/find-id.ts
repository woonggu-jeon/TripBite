import { z } from 'zod';

/**
 * 아이디 찾기 — 이름 + 가입 이메일로 매칭.
 * 결과는 마스킹된 아이디(예: tes***01)를 화면에 표시 (메일 발송 X).
 * 에러 메시지는 i18n 키(auth.findId.errors.*).
 */
export const findIdSchema = z.object({
  name: z.string().min(1, 'nameRequired'),
  email: z.string().email('emailInvalid'),
});

export type FindIdValues = z.infer<typeof findIdSchema>;
