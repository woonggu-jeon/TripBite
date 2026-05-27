import { describe, it, expect } from 'vitest';
import { signupSchema } from './signup';

const valid = {
  name: '홍길동',
  username: 'tester_01',
  password: '1234567890',
  birthDate: '1990-01-01',
  email: 'a@b.com',
  phone: '010-1234-5678',
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

  it('비밀번호 10자 미만 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, password: '123456789' }).success,
    ).toBe(false);
  });

  it('생년월일 형식(YYYY-MM-DD) 아니면 거부', () => {
    expect(
      signupSchema.safeParse({ ...valid, birthDate: '1990/01/01' }).success,
    ).toBe(false);
  });

  it('잘못된 이메일 거부', () => {
    expect(signupSchema.safeParse({ ...valid, email: 'no' }).success).toBe(
      false,
    );
  });

  it('잘못된 휴대폰 번호 거부', () => {
    expect(signupSchema.safeParse({ ...valid, phone: '123' }).success).toBe(
      false,
    );
  });

  it('하이픈 없는 폰번호도 허용', () => {
    expect(
      signupSchema.safeParse({ ...valid, phone: '01012345678' }).success,
    ).toBe(true);
  });

  it('이름 공백만 거부', () => {
    expect(signupSchema.safeParse({ ...valid, name: '   ' }).success).toBe(
      false,
    );
  });
});
