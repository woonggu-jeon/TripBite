import type { AnalyticsProvider } from '@/features/analytics/types';

/** Console provider — 개발 환경 디버깅용 */
export const consoleProvider: AnalyticsProvider = {
  name: 'console',
  track: (event, payload) => {
    if (process.env.NODE_ENV !== 'development') return;
    // eslint-disable-next-line no-console
    console.log(`[track] ${event}`, payload ?? '');
  },
  pageView: (pathname) => {
    if (process.env.NODE_ENV !== 'development') return;
    // eslint-disable-next-line no-console
    console.log(`[track] page.viewed`, pathname);
  },
};
