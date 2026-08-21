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
 *   'nonce-{nonce}' 'strict-dynamic' — nonce 있는 script가 로드한 것만 신뢰.
 *   Next.js가 x-nonce 헤더를 감지해 하이드레이션 inline script에 nonce 자동 부여.
 *   'strict-dynamic'이 있으면 'unsafe-inline'은 모던 브라우저에서 무시됨(전환 대비).
 *   dev는 React 리프레시 등으로 'unsafe-eval' 필요.
 */
import { getApiOrigin } from './api-origin';

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  // CSP connect-src 는 origin 만 받음 — path 포함 시 host-source 파싱 실패해
  // 해당 origin fetch 가 CSP block. helper 로 정규화.
  const apiUrl = getApiOrigin();

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // React inline style (140건+) 때문에 'unsafe-inline' 유지 — DOM style
    // attribute 는 nonce 부여 불가. script-src 의 nonce+strict-dynamic 이 XSS
    // 핵심 방어, style injection 은 위험 작음. enforce 전환 시에도 동일.
    // jsdelivr 제거 (2026-06-18) — Pretendard self-host 이후 브라우저 사용 0.
    // OG route 의 jsdelivr fetch 는 서버측 (edge runtime) 이라 CSP 무관.
    "style-src 'self' 'unsafe-inline'",
    // apiUrl: 프로필 아바타(/me/avatar) avatarUrl 이 API 오리진과 동일 가정(2026-08).
    // 별도 CDN 으로 옮기면 host 를 여기 + next.config remotePatterns 에 반영.
    `img-src 'self' data: blob: https://tong.visitkorea.or.kr ${apiUrl}`.trim(),
    "font-src 'self' data:",
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
