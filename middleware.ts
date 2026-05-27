import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp } from '@/lib/csp';

/**
 * Middleware
 *
 * 책임:
 *   1) 인증: 쿠키 존재 여부 체크 (JWT 검증/리프레시는 axios interceptor)
 *   2) CSRF: state-changing 요청의 Origin 화이트리스트 검증 (1차 방어)
 *   3) CSP: 요청별 nonce 발급 + Content-Security-Policy-Report-Only 헤더
 *
 * 보호 정책:
 *   - /login                비인증만 (인증 시 / 로)
 *   - 그 외 모든 경로         인증 필요 (비인증 시 /login)
 *   onboarding 완료 분기는 AuthBootstrap에서 (user.isOnboarded 필요)
 */

const PUBLIC_ONLY_PATHS = ['/login'];
const ACCESS_TOKEN_COOKIE = 'access_token';
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

  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const isPublicOnly = PUBLIC_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // ── 인증 redirect (CSP 헤더 동반) ──
  if (isPublicOnly && hasAccessToken) {
    return withCsp(NextResponse.redirect(new URL('/', request.url)), csp);
  }
  if (!isPublicOnly && !hasAccessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return withCsp(NextResponse.redirect(loginUrl), csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy-Report-Only', csp);
  return response;
}

function withCsp(res: NextResponse, csp: string): NextResponse {
  res.headers.set('Content-Security-Policy-Report-Only', csp);
  return res;
}

export const config = {
  matcher: [
    // /api 제외: health·csp-report는 공개(미인증 redirect 방지), 그 외 API는 별도 백엔드.
    // Server Action(페이지 route로의 POST)은 /api가 아니므로 CSRF 체크 유지됨.
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*).*)',
  ],
};
