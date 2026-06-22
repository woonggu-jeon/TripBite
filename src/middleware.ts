import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp } from '@/lib/csp';

/**
 * Middleware
 *
 * 책임:
 *   1) CSRF: state-changing 요청의 Origin 화이트리스트 검증 (1차 방어)
 *   2) 인증된 사용자의 /login·/signup 재진입 차단 → ?redirect= 또는 / (SSR)
 *   3) 비인증의 보호 경로 진입 차단 → /login?redirect=... (SSR, FOUC 0)
 *   4) Onboarding redirect: first-visit 디바이스 → /onboarding (SSR 단계, FOUC 0)
 *   5) CSP: 요청별 nonce 발급 + Content-Security-Policy-Report-Only 헤더
 *
 * 인증 redirect (2026-06-12 이전): cross-origin 운영에서 BE cookie 가 FE 도메인
 * cookie jar 에 들어오지 않아 SSR check 무용 → 클라 AuthGuard 책임. 그러나
 * same-origin proxy (`/api/backend/*`) 도입 이후 BE 의 Set-Cookie 가 FE 도메인
 * (vercel.app) 에 저장되므로 middleware 에서 SID 가시. SSR 단계 redirect 로 이전 →
 * 클라 hydration race 제거 + FOUC 0.
 *
 * 한계: middleware 는 SID **존재** 만 검사 (DB 검증 X). 만료된 SID 는 통과 →
 * 첫 API 호출에서 401 → axios interceptor 의 hard redirect 가 안전망.
 *
 * Onboarding 신호 — `tripbite.visited` (same-origin FE cookie, HttpOnly 아님):
 *   - 첫 진입: cookie 없음 → `/onboarding` redirect
 *   - OnboardingFlow finish 시 cookie set + `/` 이동
 *   - 다음부터: cookie 있음 → 그대로 진입
 *   - 디바이스 단위 신호 (multi-device 첫 진입은 onboarding 한 번 더). 인증 무관.
 */

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// 인증 필요 경로 — 비인증 시 /login redirect.
// docs/FEATURES.md §A + services/interceptors/auth.ts 의 PROTECTED_PATHS 와 동기.
const PROTECTED_PATHS = ['/mypage', '/settings', '/letter', '/notifications'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// 비인증 진입용 페이지 — 인증된 사용자가 들어오면 / 또는 ?redirect= 의 안전 경로로.
// /find-id, /forgot-password, /reset-password 는 인증 무관 (token 기반) → 제외.
// /onboarding 은 visited cookie 기반 별도 처리 → 제외.
// /signup/complete 는 가입 직후 SID 있는 사용자가 진입하는 정상 흐름 — exact
// match 만 하여 sub-path 제외 (2026-06-19 사용자 보고 fix).
const AUTH_ENTRY_PATHS = ['/login', '/signup'];

function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PATHS.includes(pathname);
}

function safeRedirectParam(raw: string | null): string {
  // open-redirect 차단 — 같은 origin 의 path 만 허용. LoginForm 의 가드와 동기.
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

// BE 가 발급하는 sessionID cookie 이름. env override 가능 (운영/스테이징 분리용).
const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE || 'SID';

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

  const { pathname } = request.nextUrl;

  // mock 환경 skip 토글: MSW handler 가 Set-Cookie SID 발급 안 함 — 검사 시 무한 루프.
  // MockAuthToggle + 401 분기로 dev UX 보호 (interceptor 도 동일하게 skip).
  const isMockMode = process.env.NEXT_PUBLIC_USE_MSW === 'true';
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // ── 인증된 사용자의 /login·/signup 진입 차단 ──
  // 뒤로가기로 다시 form 보는 비정상 UX 회피. ?redirect= 안전 경로 우선, 없으면 /.
  if (!isMockMode && hasSession && isAuthEntryPath(pathname)) {
    const target = new URL(
      safeRedirectParam(request.nextUrl.searchParams.get('redirect')),
      request.url,
    );
    const redirectRes = NextResponse.redirect(target);
    redirectRes.headers.set('Cache-Control', 'no-store, must-revalidate');
    return redirectRes;
  }

  // ── 인증 redirect (보호 경로 + SID 없음) ──
  // SSR 단계 — 클라 hydration race 무관. paint 0.
  // SID 만료 케이스는 통과 후 첫 API 401 → interceptor hard redirect 가 처리.
  if (!isMockMode && isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.headers.set('Cache-Control', 'no-store, must-revalidate');
    return redirectRes;
  }

  // ── Onboarding redirect (first-visit) ──
  // - 원래 path 를 ?next 로 보존 → deep-link / 공유 링크 UX 유지
  // - Cache-Control: no-store → Vercel CDN 이 redirect 응답 캐싱 X (cookie 있는 사용자 회귀 회피)
  const hasVisited = request.cookies.has('tripbite.visited');
  if (!hasVisited && !shouldSkipOnboarding(pathname)) {
    const target = new URL('/onboarding', request.url);
    if (pathname !== '/') {
      target.searchParams.set('next', pathname + request.nextUrl.search);
    }
    const redirectRes = NextResponse.redirect(target);
    redirectRes.headers.set('Cache-Control', 'no-store, must-revalidate');
    return redirectRes;
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
