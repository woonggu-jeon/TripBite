import { describe, it, expect } from 'vitest';
import { buildCsp } from './csp';

describe('buildCsp', () => {
  const csp = buildCsp('test-nonce-123');

  it("script-src에 'self' + nonce (strict-dynamic 폐기 — self 무시 회귀 회피)", () => {
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce-123'");
    expect(csp).not.toContain("'strict-dynamic'");
  });

  it('sentry.io는 포함하지 않음 (client Sentry 미사용)', () => {
    expect(csp).not.toContain('sentry.io');
  });

  it('connect-src에 Vercel Speed Insights 허용', () => {
    expect(csp).toContain('vitals.vercel-insights.com');
  });

  it('위반 보고 endpoint(report-uri) 포함', () => {
    expect(csp).toContain('report-uri /api/csp-report');
  });

  it('clickjacking 방어 (frame-ancestors none)', () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('요청마다 다른 nonce가 반영됨', () => {
    expect(buildCsp('aaa')).toContain("'nonce-aaa'");
    expect(buildCsp('bbb')).toContain("'nonce-bbb'");
  });
});
