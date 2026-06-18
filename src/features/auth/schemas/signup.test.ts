import { describe, it, expect } from 'vitest';
import { signupSchema } from './signup';

const valid = {
  username: 'tester01',
  nickname: '여행자',
  password: 'Abcd1234!@',
  passwordConfirm: 'Abcd1234!@',
  email: 'a@b.com',
};

describe('signupSchema', () => {
  it('유효 입력 통과', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it('아이디 4자 미만 거부', () => {
    expect(signupSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(
      false,
    );
  });

  it('아이디 underscore 거부 (BE pattern 변경 — 영문/숫자만)', () => {
    expect(
      signupSchema.safeParse({ ...valid, username: 'tester_01' }).success,
    ).toBe(false);
  });

  it('비밀번호 10자 미만 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, password: 'Abc1!' }).success,
    ).toBe(false);
  });

  it('비밀번호 강도 미달 거부 (특문 없음)', () => {
    expect(
      signupSchema.safeParse({
        ...valid,
        password: 'Abcdefgh12',
        passwordConfirm: 'Abcdefgh12',
      }).success,
    ).toBe(false);
  });

  it('비밀번호 강도 미달 거부 (숫자 없음)', () => {
    expect(
      signupSchema.safeParse({
        ...valid,
        password: 'Abcdefgh!@',
        passwordConfirm: 'Abcdefgh!@',
      }).success,
    ).toBe(false);
  });

  it('잘못된 이메일 거부', () => {
    expect(signupSchema.safeParse({ ...valid, email: 'no' }).success).toBe(
      false,
    );
  });

  it('닉네임 2자 미만 거부', () => {
    expect(signupSchema.safeParse({ ...valid, nickname: '여' }).success).toBe(
      false,
    );
  });

  it('닉네임 10자 초과 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, nickname: '12345678901' }).success,
    ).toBe(false);
  });

  it('닉네임 특수문자 포함 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, nickname: '여행자@' }).success,
    ).toBe(false);
  });

  it('닉네임 한글+영문+숫자 혼합 허용', () => {
    expect(
      signupSchema.safeParse({ ...valid, nickname: 'A1여행자' }).success,
    ).toBe(true);
  });

  it('비밀번호 확인 불일치 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, passwordConfirm: 'Different1!@' })
        .success,
    ).toBe(false);
  });
});
