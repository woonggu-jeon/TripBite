import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from './src/lib/sentry-scrub';

/**
 * Sentry — Node 서버 런타임 init
 *
 * DSN 가드:
 *   NEXT_PUBLIC_SENTRY_DSN 미설정이면 init을 건너뜀 → 완전 no-op.
 *   dev/preview(DSN 없음)에서 안전. 운영에서 DSN 넣으면 즉시 활성.
 *
 * 소스맵 업로드(릴리스 추적)는 next.config.js의 withSentryConfig 필요 — 주석 가이드 참고.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    beforeSend: (event) => scrubEvent(event),
  });
}
