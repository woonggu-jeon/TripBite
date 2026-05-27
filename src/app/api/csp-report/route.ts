import { NextResponse } from 'next/server';

/**
 * CSP 위반 보고 수집 엔드포인트
 *
 * `Content-Security-Policy-Report-Only`의 `report-uri`가 위반을 여기로 POST.
 * Report-Only 단계에서 위반을 모니터링 → enforce 전환 전 nonce/디렉티브 조정 근거.
 *
 * 브라우저는 application/csp-report 또는 application/reports+json 으로 전송.
 * 현재는 콘솔 로그(운영은 Sentry/수집 도구로 교체).
 */
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // CSP Level 2: { "csp-report": {...} } / Reporting API: [{...}]

    console.warn('[csp-violation]', JSON.stringify(body));
  } catch {
    // 파싱 실패 무시 — 보고 수집은 best-effort
  }
  return new NextResponse(null, { status: 204 });
}
