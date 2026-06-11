/**
 * Content Security Policy 빌더
 *
 * middleware에서 요청마다 nonce를 받아 CSP 문자열 생성.
 * (정적 헤더로는 요청별 nonce 불가 → next.config.js가 아닌 middleware에서 발급)
 *
 * 단계:
 *   1. 현재: Content-Security-Policy-Report-Only — 위반 보고만, 차단 X
 *   2. enforce 전환: middleware에서 헤더 이름을 'Content-Security-Policy'로
 *      + style-src의 'unsafe-inline' 제거 (nonce/hash로 대체)
 *
 * script-src 전략:
 *   'self' 'nonce-{nonce}' — same-origin chunk + nonce 있는 inline script 허용.
 *   Next.js 가 production build 에서 webpack chunk (`/_next/static/chunks/*.js`)
 *   를 same-origin 으로 load — 'self' 가 그것을 허용. inline hydration script 는
 *   x-nonce 헤더로 nonce 자동 부여.
 *
 *   회귀 사유 — 'strict-dynamic' 활성 시 브라우저가 'self' 무시 (spec):
 *     nonce 있는 script 만 + 그게 load 한 child 만 허용 → webpack chunk 가 nonce
 *     없이 load 되어 CSP 차단. Report-Only 라 동작은 됐지만 enforce 전환 시 깨짐.
 *     Next.js App Router 의 chunk 가 nonce 첨부 안 됨 (static asset 라 정상).
 *
 *   dev 는 React 리프레시 등으로 'unsafe-eval' 필요.
 */
import { getApiOrigin } from './api-origin';

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  // CSP connect-src 는 origin 만 받음 — path 포함 시 host-source 파싱 실패해
  // 해당 origin fetch 가 CSP block. helper 로 정규화.
  const apiUrl = getApiOrigin();

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    // jsdelivr — Pretendard 폰트 CSS (style은 nonce 미적용, unsafe-inline 유지)
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://tong.visitkorea.or.kr",
    "font-src 'self' data: https://cdn.jsdelivr.net",
    // connect-src: 백엔드 + Vercel Speed Insights / Analytics.
    `connect-src 'self' ${apiUrl} https://vitals.vercel-insights.com`.trim(),
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // 위반 보고 수집 → enforce 전환 전 모니터링 (src/app/api/csp-report)
    'report-uri /api/csp-report',
    isDev ? '' : 'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ');
}
