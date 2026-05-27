import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook
 *
 * 런타임별 Sentry 설정을 로드.
 * server/edge config 내부에서 DSN 가드 → 미설정 시 no-op.
 *
 * ⚠️ Client Sentry 의도적 비활성:
 *   instrumentation-client.ts를 두면 Sentry SDK가 모든 페이지 First Load JS에
 *   ~80KB 추가됨 (측정 확인). "렌더링 속도 최우선" 원칙상 client는 제외하고
 *   server/edge 에러만 추적. client 에러 추적이 꼭 필요해지면 lazy-load 패턴으로
 *   별도 도입 검토 (DSN 있을 때만 동적 import).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// 서버 컴포넌트/route handler 에러를 Sentry로 (DSN 없으면 no-op)
export const onRequestError = Sentry.captureRequestError;
