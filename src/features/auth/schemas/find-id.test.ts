import { describe, it, expect } from 'vitest';
import { findIdSchema } from './find-id';

describe('findIdSchema', () => {
  it('이름+이메일 통과', () => {
    expect(
      findIdSchema.safeParse({ name: '홍길동', email: 'a@b.com' }).success,
    ).toBe(true);
  });
  it('빈 이름 거부', () => {
    expect(findIdSchema.safeParse({ name: '', email: 'a@b.com' }).success).toBe(
      false,
    );
  });
  it('잘못된 이메일 거부', () => {
    expect(findIdSchema.safeParse({ name: '홍길동', email: 'x' }).success).toBe(
      false,
    );
  });
});
