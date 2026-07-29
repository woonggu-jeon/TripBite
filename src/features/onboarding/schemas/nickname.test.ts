import { describe, expect, it } from 'vitest';
import { nicknameSchema } from './nickname';

/**
 * nicknameSchema 검증 샘플 테스트
 *
 * 보안 규칙(zero-width/HTML/제어문자 차단)이 회귀하면 즉시 잡힘.
 * 순수 함수라 MSW/intl 의존 없음 — 테스트 인프라 동작 확인용 기준점.
 */
describe('nicknameSchema', () => {
  it('한글/영문/숫자/언더스코어 1~10자 통과', () => {
    expect(nicknameSchema.safeParse({ nickname: '여행자_01' }).success).toBe(
      true,
    );
  });

  it('빈 문자열 거부 (tooShort)', () => {
    const r = nicknameSchema.safeParse({ nickname: '' });
    expect(r.success).toBe(false);
  });

  it('11자 이상 거부 (tooLong)', () => {
    const r = nicknameSchema.safeParse({ nickname: 'a'.repeat(11) });
    expect(r.success).toBe(false);
  });

  it('HTML 특수문자 거부', () => {
    expect(nicknameSchema.safeParse({ nickname: '<script>' }).success).toBe(
      false,
    );
  });

  it('zero-width 문자 거부', () => {
    expect(nicknameSchema.safeParse({ nickname: 'a​b' }).success).toBe(false);
  });

  it('허용 외 기호 거부', () => {
    expect(nicknameSchema.safeParse({ nickname: 'hi!' }).success).toBe(false);
  });

  it('앞뒤 공백은 trim 후 검증', () => {
    const r = nicknameSchema.safeParse({ nickname: '  여행자  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nickname).toBe('여행자');
  });
});
