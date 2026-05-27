import { describe, it, expect } from 'vitest';
import { loginSchema } from './login';

describe('loginSchema', () => {
  it('유효한 이메일+비밀번호 통과', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success,
    ).toBe(true);
  });

  it('이메일 형식 오류 거부', () => {
    const r = loginSchema.safeParse({
      email: 'not-email',
      password: '12345678',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('emailInvalid');
  });

  it('빈 이메일 거부', () => {
    const r = loginSchema.safeParse({ email: '', password: '12345678' });
    expect(r.success).toBe(false);
  });

  it('8자 미만 비밀번호 거부 (passwordMin)', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('passwordMin');
  });

  it('72자 초과 비밀번호 거부', () => {
    const r = loginSchema.safeParse({
      email: 'a@b.com',
      password: 'a'.repeat(73),
    });
    expect(r.success).toBe(false);
  });
});
