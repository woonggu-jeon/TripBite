import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { buildCsp } from '@/lib/csp';
import { routing } from '@/i18n/routing';

/**
 * Middleware
 *
 * 책임:
 *   1) i18n routing: URL prefix 기반 locale 매핑 (next-intl middleware)
 *   2) CSRF: state-changing 요청의 Origin 화이트리스트 검증 (1차 방어)
 *   3) CSP: 요청별 nonce 발급 + Content-Security-Policy-Report-Only 헤더
 *
 * 인증 redirect 는 AuthBootstrap (client-side) 책임 — cross-origin 운영에서
 * BE cookie 가 FE 도메인 cookie jar 에 들어오지 않아 SSR 단계 cookie check
 * 가 무용지물.
 *
 * 합성 순서:
 *   1) CSRF Origin 검증 — 차단 시 즉시 reject (intl 매핑 전)
 *   2) intl middleware — locale prefix 정규화 후 redirect 또는 next
 *   3) CSP 헤더 — 모든 응답에 첨부 (intl middleware 가 반환한 NextResponse 에도)
 */

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  // ── CSRF 1차 방어: state-changing 요청의 Origin이 our origin과 다르면 차단 ──
  if (STATE_CHANGING.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
      return new NextResponse('Forbidden: cross-origin request', {
        status: 403,
      });
    }
  }

  // ── CSP nonce 발급 ──
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  // ── intl middleware 적용 ──
  // next-intl 이 NextResponse (next 또는 redirect) 반환. 그 위에 CSP 헤더 첨부.
  const response = intlMiddleware(request);

  // intl middleware 가 next 인 경우 request headers 에 x-nonce / CSP 첨부 — Next.js 가
  // 하이드레이션 inline script 에 nonce 자동 부여.
  response.headers.set('x-nonce', nonce);
  response.headers.set(cspHeaderName(), csp);
  return response;
}

/**
 * CSP 헤더 이름 — 기본 Report-Only, NEXT_PUBLIC_CSP_ENFORCE=true 시 enforce.
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
