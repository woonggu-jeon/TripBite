import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { safeParseResponse } from './safe-parse-response';

const schema = z.object({
  id: z.string(),
  count: z.number(),
});

describe('safeParseResponse', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('성공 시 parsed data 반환 + warn 미호출', () => {
    const out = safeParseResponse(schema, { id: 'a', count: 7 }, 'GET /x');
    expect(out).toEqual({ id: 'a', count: 7 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('실패 시 원본 data 강제 cast + dev warn 출력', () => {
    // count 가 number 가 아닌 string — schema 실패
    const data = { id: 'a', count: '7' };
    const out = safeParseResponse(schema, data, 'GET /x');
    // crash 없이 원본 그대로 반환
    expect(out).toBe(data);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = String(warnSpy.mock.calls[0]?.[0] ?? '');
    expect(msg).toContain('schema mismatch');
    expect(msg).toContain('GET /x');
  });

  it('null/undefined 응답도 cast 후 반환', () => {
    const out = safeParseResponse(schema, null, 'GET /x');
    expect(out).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('production 환경에선 warn 미출력', () => {
    const prev = process.env.NODE_ENV;
    // vitest 환경에서 NODE_ENV 는 readonly 처럼 보일 수 있어 stub
    vi.stubEnv('NODE_ENV', 'production');
    safeParseResponse(schema, { wrong: 'shape' }, 'GET /x');
    expect(warnSpy).not.toHaveBeenCalled();
    vi.stubEnv('NODE_ENV', prev ?? 'test');
  });
});
