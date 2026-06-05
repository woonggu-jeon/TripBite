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
 *   - PUBLIC_ONLY_PATHS    인증 시 / 로 (login 페이지 등)
 *   - PROTECTED_PATHS      비인증 시 /login 으로 (개인 정보 페이지)
 *   - 그 외 모든 경로       비인증 진입 허용 (홈/토너먼트/유형테스트/랭킹/시군/여행지)
 *   onboarding 완료 분기는 AuthBootstrap에서 (user.isOnboarded 필요)
 */

// 인증된 사용자가 진입 시 / 로 보냄 ("로그인된 사람이 로그인 페이지 보면 안 됨")
// /reset-password 는 token 기반 흐름 — 이메일 링크에서 진입 시 로그인 상태와 무관하게
// 토큰 검증해야 하므로 제외. (다른 디바이스에서 로그인된 사용자가 메일 링크 클릭하는
// 케이스가 정상 시나리오 — / 로 차단되면 비밀번호 재설정 불가능 회귀.)
const PUBLIC_ONLY_PATHS = ['/login', '/signup', '/forgot-password', '/find-id'];

// 비인증 사용자 차단 — 개인 정보 페이지. 비로그인 진입 시 /login?redirect= 으로 보냄.
// 그 외 모든 경로 (/ , /tournament, /quiz, /ranking, /region, /destination 등) 는 비로그인도 접근 가능.
// 알림함 (/notifications) 은 이제 페이지 — 보호 경로 포함.
const PROTECTED_PATHS = ['/mypage', '/settings', '/letter', '/notifications'];

// sessionID 단일 쿠키 — BE 가 'SID' (또는 NEXT_PUBLIC_SESSION_COOKIE) 발급.
// AUTH_FLOWS.md 의 sessionID 모델 — JWT access/refresh 폐기 후 단일.
const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE ?? 'SID';
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

  // mock 환경 (NEXT_PUBLIC_USE_MSW=true) 에서는 백엔드가 없어 session 발급 불가.
  // 인증 redirect 를 skip 해 모든 페이지를 둘러볼 수 있게 함. E2E 는 별도 cookie 주입.
  // 운영 빌드 (USE_MSW=false) 에서는 그대로 redirect 동작.
  const isMockMode = process.env.NEXT_PUBLIC_USE_MSW === 'true';

  if (!isMockMode) {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies.has(SESSION_COOKIE);
    const isPublicOnly = PUBLIC_ONLY_PATHS.some((p) => pathname.startsWith(p));
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

    if (isPublicOnly && hasSession) {
      return withCsp(NextResponse.redirect(new URL('/', request.url)), csp);
    }
    if (isProtected && !hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return withCsp(NextResponse.redirect(loginUrl), csp);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(cspHeaderName(), csp);
  return response;
}

function withCsp(res: NextResponse, csp: string): NextResponse {
  res.headers.set(cspHeaderName(), csp);
  return res;
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
