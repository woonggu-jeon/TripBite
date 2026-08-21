import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './password-reset';

describe('forgotPasswordSchema', () => {
  const valid = { username: 'tester01', email: 'a@b.com' };
  it('username + email 통과', () => {
    expect(forgotPasswordSchema.safeParse(valid).success).toBe(true);
  });
  it('잘못된 이메일 거부', () => {
    expect(
      forgotPasswordSchema.safeParse({ ...valid, email: 'x' }).success,
    ).toBe(false);
  });
  it('잘못된 아이디 (특수문자 포함) 거부', () => {
    expect(
      forgotPasswordSchema.safeParse({ ...valid, username: 'a@b' }).success,
    ).toBe(false);
  });
  it('아이디 4자 미만 거부', () => {
    expect(
      forgotPasswordSchema.safeParse({ ...valid, username: 'abc' }).success,
    ).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const valid = {
    token: 't',
    password: '1234567890',
    confirmPassword: '1234567890',
  };
  it('토큰 + 10자 비번 + 확인 일치 통과', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });
  it('비번 10자 미만 거부', () => {
    expect(
      resetPasswordSchema.safeParse({
        ...valid,
        password: '123456789',
        confirmPassword: '123456789',
      }).success,
    ).toBe(false);
  });
  it('빈 토큰 거부', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, token: '' }).success).toBe(
      false,
    );
  });
  it('확인 불일치 거부 (mismatch)', () => {
    const r = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'different00',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('mismatch');
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'old',
    newPassword: '1234567890',
    confirmPassword: '1234567890',
  };
  it('현재+새(10+)+확인 일치 통과', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });
  it('새 비번 10자 미만 거부', () => {
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: '123456789',
        confirmPassword: '123456789',
      }).success,
    ).toBe(false);
  });
  it('확인 불일치 거부 (mismatch)', () => {
    const r = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'different00',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('mismatch');
  });
  it('현재 비번 빈 값 거부', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success,
    ).toBe(false);
  });
});
