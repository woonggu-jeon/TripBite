import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { useFormat } from './use-format';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="ko"
      messages={{}}
      now={new Date('2026-05-27T12:00:00Z')}
      timeZone="Asia/Seoul"
    >
      {children}
    </NextIntlClientProvider>
  );
}

describe('useFormat', () => {
  it('relativeTime — 과거 시각을 상대 표현', () => {
    const { result } = renderHook(() => useFormat(), { wrapper });
    const out = result.current.relativeTime('2026-05-27T09:00:00Z'); // 3시간 전
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('compactNumber — 큰 수 축약', () => {
    const { result } = renderHook(() => useFormat(), { wrapper });
    // ko-KR compact: 12345 → "1.2만"
    expect(result.current.compactNumber(12345)).toContain('만');
  });

  it('dateTime — 문자열 반환', () => {
    const { result } = renderHook(() => useFormat(), { wrapper });
    expect(typeof result.current.dateTime('2026-05-27T12:00:00Z')).toBe(
      'string',
    );
  });
});
