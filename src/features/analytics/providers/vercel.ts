import { track as vercelTrack } from '@vercel/analytics';
import type { AnalyticsProvider } from '@/features/analytics/types';

/**
 * Vercel Analytics provider
 *
 * 역할 분담:
 *   - page view 자동 추적: providers.tsx의 <Analytics /> 컴포넌트가 담당
 *   - custom event: 이 provider가 track()을 Vercel Web Analytics로 전달
 *
 * 주의:
 *   - Vercel Web Analytics는 string/number/boolean flat 값만 허용 → void payload는 무시
 *   - PII(email/nickname/좌표) payload 금지 (analytics/index.ts 정책)
 *   - custom event는 Vercel 플랜에 따라 제한될 수 있음 (page view는 무료)
 */
export const vercelProvider: AnalyticsProvider = {
  name: 'vercel',
  track: (event, payload) => {
    vercelTrack(
      event,
      payload as Record<string, string | number | boolean | null> | undefined,
    );
  },
};
