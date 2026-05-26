import type { AnalyticsProvider } from '@/features/analytics/types';

/** 운영 기본 — 실제 도구 도입 전까지 silent */
export const noopProvider: AnalyticsProvider = {
  name: 'noop',
  track: () => {},
};
