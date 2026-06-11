import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp } from '@/lib/csp';

/**
 * Middleware
 *
 * 책임:
 *   1) CSRF: state-changing 요청의 Origin 화이트리스트 검증 (1차 방어)
 *   2) CSP: 요청별 nonce 발급 + Content-Security-Policy-Report-Only 헤더
 *
 * 인증 redirect 는 AuthBootstrap (client-side) 책임 — cross-origin 운영에서
 * BE cookie 가 FE 도메인 cookie jar 에 들어오지 않아 SSR 단계 cookie check
 * 가 무용지물 (모두 false → 무한 redirect 회귀). 일관성 위해 mock 환경도 동일.
 */

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request: NextRequest) {
  // ── CSRF 1차 방어: state-changing 요청의 Origin이 our origin과 다르면 차단 ──
  // (백엔드 직접 호출은 middleware 미경유 → 백엔드의 Origin 검증이 본 방어선)
  if (STATE_CHANGING.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
      return new NextResponse('Forbidden: cross-origin request', {
        status: 403,
      });
    }
  }

  // ── CSP nonce 발급 ──
  // request 헤더에 CSP도 set해야 Next.js가 하이드레이션 inline script에 nonce 자동 부여.
  // layout에서 수동 사용 시 headers().get('x-nonce')로 읽음.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy-report-only', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(cspHeaderName(), csp);
  return response;
}

/**
 * CSP 헤더 이름 — 기본 Report-Only, NEXT_PUBLIC_CSP_ENFORCE=true 시 enforce.
 *
 * 점진 전환 정책:
 *   1) Report-Only 로 1-2주 운영 → /api/csp-report 의 violation 0건 확인
 *   2) NEXT_PUBLIC_CSP_ENFORCE=true 로 enforce 전환
 *   3) 문제 발생 시 즉시 false 로 롤백 (단일 env 변경)
 *
 * 주의: enforce 시 style-src 의 'unsafe-inline' 은 외부 stylesheet (jsdelivr)
 * 호환 위해 유지. 추가 보안 필요해지면 hash 매핑으로 교체.
 */
function cspHeaderName(): string {
  return process.env.NEXT_PUBLIC_CSP_ENFORCE === 'true'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
}

export const config = {
  matcher: [
    // /api 제외: health·csp-report는 공개(미인증 redirect 방지), 그 외 API는 별도 백엔드.
    // Server Action(페이지 route로의 POST)은 /api가 아니므로 CSRF 체크 유지됨.
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*).*)',
  ],
};
