import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware
 *
 * 책임: 쿠키 존재 여부만 체크 (JWT 검증/리프레시는 axios interceptor)
 *
 * 보호 정책:
 *   - /login                       비인증만 (인증 시 / 로)
 *   - /onboarding                  인증 필요 (비인증 시 /login)
 *   - 그 외 모든 (main) 경로        인증 필요
 *
 * onboarding 완료 여부 분기는 middleware가 아닌 AuthBootstrap에서 처리
 * (서버에서 user.isOnboarded를 확인해야 하므로).
 */

const PUBLIC_ONLY_PATHS = ['/login']; // 비인증 사용자만
const ACCESS_TOKEN_COOKIE = 'access_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);

  const isPublicOnly = PUBLIC_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicOnly && hasAccessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPublicOnly && !hasAccessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*).*)',
  ],
};
