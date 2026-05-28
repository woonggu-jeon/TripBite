import { describe, it, expect } from 'vitest';
import { userSchema } from './user';

describe('userSchema', () => {
  it('필수 필드(id/email/nickname)만 있어도 통과', () => {
    expect(
      userSchema.safeParse({ id: '1', email: 'a@b.com', nickname: 'tester' })
        .success,
    ).toBe(true);
  });

  it('전체 필드 + role 통과', () => {
    expect(
      userSchema.safeParse({
        id: '1',
        email: 'a@b.com',
        nickname: 'tester',
        isOnboarded: true,
        homeRegion: 'cheongju',
        role: 'user',
      }).success,
    ).toBe(true);
  });

  it('id 누락 거부', () => {
    expect(
      userSchema.safeParse({ email: 'a@b.com', nickname: 'tester' }).success,
    ).toBe(false);
  });

  it('role enum 외 값 거부', () => {
    const r = userSchema.safeParse({
      id: '1',
      email: 'a@b.com',
      nickname: 'tester',
      role: 'superuser',
    });
    expect(r.success).toBe(false);
  });
});
