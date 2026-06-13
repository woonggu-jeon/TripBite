import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportClientError } from './client-error-reporter';

// NODE_ENV 는 Next.js / vitest 환경에서 read-only 로 freezed. dev 분기 (`isProd()`
// false) 가 vitest 환경에서 항상 활성 — 본 테스트는 dev 동작 (console + endpoint X)
// 만 검증. production 분기 (sendBeacon / fetch keepalive) 는 e2e 또는 manual 검증.

describe('reportClientError (dev 분기)', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('Error 객체 — message 필드 그대로 전달', () => {
    reportClientError('window-error', new Error('boom'));
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0]?.[0]).toBe('[client-error:dev]');
    const payload = consoleWarnSpy.mock.calls[0]?.[1] as { message: string };
    expect(payload.message).toBe('boom');
  });

  it('non-Error 값 — string / object / null 모두 safe message', () => {
    reportClientError('react-query', 'plain string');
    reportClientError('react-query', { code: 500, msg: 'fail' });
    reportClientError('react-query', null);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    const p1 = consoleWarnSpy.mock.calls[0]?.[1] as { message: string };
    const p2 = consoleWarnSpy.mock.calls[1]?.[1] as { message: string };
    const p3 = consoleWarnSpy.mock.calls[2]?.[1] as { message: string };
    expect(p1.message).toBe('plain string');
    expect(p2.message).toContain('500');
    expect(p3.message).toBeDefined();
  });

  it('Error 의 long stack 은 4000 자에서 truncate', () => {
    const err = new Error('long');
    err.stack = 'x'.repeat(5000);

    reportClientError('window-error', err);

    const payload = consoleWarnSpy.mock.calls[0]?.[1] as { stack?: string };
    expect(payload.stack?.length).toBeLessThan(5000);
    expect(payload.stack).toContain('[truncated]');
  });

  it('digest extra 전달 시 payload 에 포함', () => {
    reportClientError('react-error-boundary', new Error('boom'), {
      digest: 'abc123',
    });

    const payload = consoleWarnSpy.mock.calls[0]?.[1] as { digest?: string };
    expect(payload.digest).toBe('abc123');
  });

  it('source 가 payload 에 그대로 포함', () => {
    reportClientError('unhandled-rejection', new Error('p'));
    const payload = consoleWarnSpy.mock.calls[0]?.[1] as { source: string };
    expect(payload.source).toBe('unhandled-rejection');
  });
});
