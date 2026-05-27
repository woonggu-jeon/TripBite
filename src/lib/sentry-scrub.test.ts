import { describe, it, expect } from 'vitest';
import { scrubEvent } from './sentry-scrub';

describe('scrubEvent', () => {
  it('URL 쿼리의 토큰류 마스킹', () => {
    const event = {
      request: { url: 'https://x.com/p?access_token=secret&page=1' },
    };
    const out = scrubEvent(event);
    expect(out.request?.url).toContain('access_token=***');
    expect(out.request?.url).toContain('page=1');
    expect(out.request?.url).not.toContain('secret');
  });

  it('body의 비밀번호/토큰 마스킹', () => {
    const event = {
      request: {
        data: { password: 'pw', refresh_token: 'rt', email: 'e@e.com' },
      },
    };
    scrubEvent(event);
    const data = event.request.data as Record<string, unknown>;
    expect(data.password).toBe('***');
    expect(data.refresh_token).toBe('***');
    expect(data.email).toBe('e@e.com'); // 민감 키 외엔 보존
  });

  it('request 없으면 그대로 반환', () => {
    const event = {};
    expect(scrubEvent(event)).toBe(event);
  });
});
