import { createLogger, logger } from '@/lib/logger';

/**
 * jest 병행 러너 샘플 + pino 공통 로거 스모크.
 * (파일명 `*.jest.test.ts` → jest 만 담당, vitest 는 제외)
 */
describe('logger (pino 공통 로거) — jest', () => {
  it('logger 는 pino 인스턴스 API 를 노출한다', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
    expect(typeof logger.level).toBe('string');
  });

  it('createLogger 는 scope child 로거를 반환하고 호출이 throw 하지 않는다', () => {
    const log = createLogger('jest-sample', { feature: 'x' });
    expect(typeof log.info).toBe('function');
    expect(() => log.info({ a: 1 }, 'hello')).not.toThrow();
  });
});
