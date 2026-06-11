import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp } from '@/lib/csp';

/**
 * Middleware
 *
 * 책임:
 *   1) CSRF: state-changing 요청의 Origin 화이트리스트 검증 (1차 방어)
 *   2) Onboarding redirect: first-visit 디바이스 → /onboarding (SSR 단계, FOUC 0)
 *   3) CSP: 요청별 nonce 발급 + Content-Security-Policy-Report-Only 헤더
 *
 * 인증 redirect 는 AuthBootstrap (client-side) 책임 — cross-origin 운영에서
 * BE cookie 가 FE 도메인 cookie jar 에 들어오지 않아 SSR cookie check 무용지물.
 *
 * Onboarding 신호 — `tripbite.visited` (same-origin FE cookie, HttpOnly 아님):
 *   - 첫 진입: cookie 없음 → `/onboarding` redirect
 *   - OnboardingFlow finish 시 cookie set + `/` 이동
 *   - 다음부터: cookie 있음 → 그대로 진입
 *   - 디바이스 단위 신호 (multi-device 첫 진입은 onboarding 한 번 더). 인증 무관.
 */

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// onboarding skip — auth/policy/offline/onboarding 자체 (무한 redirect 회피).
const SKIP_ONBOARDING_PATHS = [
  '/onboarding',
  '/login',
  '/signup',
  '/find-id',
  '/forgot-password',
  '/reset-password',
  '/policy',
  '/offline',
];

function shouldSkipOnboarding(pathname: string): boolean {
  return SKIP_ONBOARDING_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

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

  // ── Onboarding redirect (first-visit) ──
  const { pathname } = request.nextUrl;
  const hasVisited = request.cookies.has('tripbite.visited');
  if (!hasVisited && !shouldSkipOnboarding(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // ── CSP nonce 발급 ──
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
 */
function cspHeaderName(): string {
  return process.env.NEXT_PUBLIC_CSP_ENFORCE === 'true'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
}

export const config = {
  matcher: [
    // /api 제외: health·csp-report는 공개. Server Action(페이지 route POST)은 /api 가 아니라 유지.
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*).*)',
  ],
};
