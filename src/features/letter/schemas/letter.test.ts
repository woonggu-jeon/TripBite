import { describe, it, expect } from 'vitest';
import { letterSchema, graphemeLength } from './letter';

describe('letterSchema', () => {
  it('1~5자 통과', () => {
    expect(letterSchema.safeParse({ body: '안녕하세요' }).success).toBe(true);
    expect(letterSchema.safeParse({ body: '하' }).success).toBe(true);
  });

  it('6자 이상 거부', () => {
    expect(letterSchema.safeParse({ body: '여섯글자입니' }).success).toBe(
      false,
    );
  });

  it('공백만 거부', () => {
    expect(letterSchema.safeParse({ body: '   ' }).success).toBe(false);
  });

  it('HTML 특수문자 거부', () => {
    expect(letterSchema.safeParse({ body: '<b>' }).success).toBe(false);
  });

  it('zero-width 문자 거부', () => {
    expect(letterSchema.safeParse({ body: 'a​b' }).success).toBe(false);
  });

  it('제어문자(탭) 거부', () => {
    expect(letterSchema.safeParse({ body: 'a\tb' }).success).toBe(false);
  });
});

describe('graphemeLength', () => {
  it('한글 글자 수', () => {
    expect(graphemeLength('안녕')).toBe(2);
  });
});
