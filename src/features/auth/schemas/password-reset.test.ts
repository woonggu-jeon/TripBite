import { describe, it, expect } from 'vitest';
import { forgotPasswordSchema, resetPasswordSchema } from './password-reset';

describe('forgotPasswordSchema', () => {
  it('유효 이메일 통과', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(
      true,
    );
  });
  it('잘못된 이메일 거부', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('토큰 + 10자 비번 통과', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 't', password: '1234567890' })
        .success,
    ).toBe(true);
  });
  it('비번 10자 미만 거부', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 't', password: '123456789' })
        .success,
    ).toBe(false);
  });
  it('빈 토큰 거부', () => {
    expect(
      resetPasswordSchema.safeParse({ token: '', password: '1234567890' })
        .success,
    ).toBe(false);
  });
});
