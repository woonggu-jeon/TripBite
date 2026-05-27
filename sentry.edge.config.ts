import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from './src/lib/sentry-scrub';

/**
 * Sentry — Edge 런타임 init (middleware, edge route handler)
 * DSN 미설정 시 no-op.
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
