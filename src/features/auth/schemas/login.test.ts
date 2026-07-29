import { describe, expect, it } from 'vitest';
import { loginSchema } from './login';

describe('loginSchema', () => {
  it('아이디+비밀번호 통과', () => {
    expect(
      loginSchema.safeParse({ username: 'tester01', password: 'pw' }).success,
    ).toBe(true);
  });

  it('빈 아이디 거부 (usernameRequired)', () => {
    const r = loginSchema.safeParse({ username: '', password: 'pw' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('usernameRequired');
  });

  it('빈 비밀번호 거부 (passwordRequired)', () => {
    const r = loginSchema.safeParse({ username: 'tester01', password: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('passwordRequired');
  });
});
