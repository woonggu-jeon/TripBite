import { describe, expect, it } from 'vitest';
import { findIdSchema } from './find-id';

describe('findIdSchema', () => {
  it('이메일만으로 통과 (BE FindIdDto 단순화)', () => {
    expect(findIdSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
  it('잘못된 이메일 거부', () => {
    expect(findIdSchema.safeParse({ email: 'x' }).success).toBe(false);
  });
  it('빈 이메일 거부', () => {
    expect(findIdSchema.safeParse({ email: '' }).success).toBe(false);
  });
});
