import { consoleProvider } from './providers/console';
import { noopProvider } from './providers/noop';
import { vercelProvider } from './providers/vercel';
import type { AnalyticsProvider, TrackEventMap, TrackEventName } from './types';

/**
 * Analytics 추상화 — 호출부 변경 없이 도구 교체 가능
 *
 * 사용:
 *   import { track } from '@/features/analytics';
 *   track('tournament.completed', { winnerId, category, duration_ms });
 *
 * 운영 도구 추가 (예: Vercel Analytics):
 *   1) providers/vercel.ts 작성
 *   2) provider 배열에 추가
 *   3) 호출부 그대로
 *
 * PII 정책:
 *   - email/nickname/위치 좌표는 payload 금지
 *   - 필요하면 hash 후 전송
 */
/**
 * provider 구성:
 *   - dev: console (디버깅)
 *   - prod: vercel (custom event) + noop (fallback)
 * page view는 providers.tsx의 <Analytics /> 컴포넌트가 별도로 자동 추적.
 */
const providers: AnalyticsProvider[] =
  process.env.NODE_ENV === 'development'
    ? [consoleProvider]
    : [vercelProvider, noopProvider];

let initialized = false;

export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await Promise.all(providers.map((p) => p.init?.()));
}

export function track<K extends TrackEventName>(
  event: K,
  payload?: TrackEventMap[K],
): void {
  for (const p of providers) {
    try {
      p.track(event, payload);
    } catch (err) {
      console.warn(`[analytics:${p.name}] failed`, err);
    }
  }
}

export function trackPageView(pathname: string): void {
  for (const p of providers) p.pageView?.(pathname);
}

export function identifyUser(userId: string): void {
  for (const p of providers) p.identify?.(userId);
}

export function resetAnalytics(): void {
  for (const p of providers) p.reset?.();
}

export type { TrackEventName, TrackEventMap, AnalyticsProvider };
