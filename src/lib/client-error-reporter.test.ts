import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportClientError } from './client-error-reporter';

// NODE_ENV 는 vitest 환경에서 dev — reportClientError 의 dev 분기(`isProd()` false)가
// 항상 활성. dev 분기는 이제 pino 공통 로거(`@/lib/logger`)로 payload 를 기록하므로
// 로거를 mock 해 payload 구성(message/stack truncate/digest/source)을 검증한다.
// production 분기(sendBeacon / fetch keepalive)는 e2e 또는 manual 검증.
const { errorSpy } = vi.hoisted(() => ({ errorSpy: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: errorSpy,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  }),
}));

describe('reportClientError (dev 분기)', () => {
  beforeEach(() => {
    errorSpy.mockClear();
  });

  it('Error 객체 — message 필드 그대로 전달', () => {
    reportClientError('window-error', new Error('boom'));
    expect(errorSpy).toHaveBeenCalledTimes(1);
    // log.error(payload, 'client error (dev)') — payload 가 첫 인자.
    const payload = errorSpy.mock.calls[0]?.[0] as { message: string };
    expect(payload.message).toBe('boom');
  });

  it('non-Error 값 — string / object / null 모두 safe message', () => {
    reportClientError('react-query', 'plain string');
    reportClientError('react-query', { code: 500, msg: 'fail' });
    reportClientError('react-query', null);

    expect(errorSpy).toHaveBeenCalledTimes(3);
    const p1 = errorSpy.mock.calls[0]?.[0] as { message: string };
    const p2 = errorSpy.mock.calls[1]?.[0] as { message: string };
    const p3 = errorSpy.mock.calls[2]?.[0] as { message: string };
    expect(p1.message).toBe('plain string');
    expect(p2.message).toContain('500');
    expect(p3.message).toBeDefined();
  });

  it('Error 의 long stack 은 4000 자에서 truncate', () => {
    const err = new Error('long');
    err.stack = 'x'.repeat(5000);

    reportClientError('window-error', err);

    const payload = errorSpy.mock.calls[0]?.[0] as { stack?: string };
    expect(payload.stack?.length).toBeLessThan(5000);
    expect(payload.stack).toContain('[truncated]');
  });

  it('digest extra 전달 시 payload 에 포함', () => {
    reportClientError('react-error-boundary', new Error('boom'), {
      digest: 'abc123',
    });

    const payload = errorSpy.mock.calls[0]?.[0] as { digest?: string };
    expect(payload.digest).toBe('abc123');
  });

  it('source 가 payload 에 그대로 포함', () => {
    reportClientError('unhandled-rejection', new Error('p'));
    const payload = errorSpy.mock.calls[0]?.[0] as { source: string };
    expect(payload.source).toBe('unhandled-rejection');
  });
});
