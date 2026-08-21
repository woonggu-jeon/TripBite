import { z } from 'zod';

/**
 * 아이디 찾기 — 가입 이메일만으로 매칭 (BE FindIdDto: { email }).
 * 결과는 마스킹된 아이디(예: tes***01)를 화면에 표시 (메일 발송 X).
 * 에러 메시지는 i18n 키(auth.findId.errors.*).
 */
export const findIdSchema = z.object({
  email: z.string().email('emailInvalid'),
});

export type FindIdValues = z.infer<typeof findIdSchema>;
