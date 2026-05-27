'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals — dev 디버그 전용 (콘솔 로깅)
 *
 * ⚠️ 운영 수집은 @vercel/speed-insights(<SpeedInsights />)가 담당.
 * 중복 방지를 위해 providers.tsx에서 dev 환경에만 마운트됨.
 * 자체 백엔드 수집(/api/metrics)이 필요해지면 아래 sendBeacon 주석 활성화.
 *
 * Next.js 의 useReportWebVitals 는 별도 의존성 없이 동작
 * (next 가 내부적으로 web-vitals 모듈 포함).
 *
 * 측정 지표:
 *   - FCP   First Contentful Paint
 *   - LCP   Largest Contentful Paint
 *   - INP   Interaction to Next Paint (FID 후속)
 *   - CLS   Cumulative Layout Shift
 *   - TTFB  Time to First Byte
 *
 * Providers 안에 한 번 마운트:
 *   <WebVitalsTracker />
 *
 * 운영에서 analytics 도구로 전송:
 *   - Vercel Analytics: useReportWebVitals 자동 통합
 *   - Sentry Performance: Sentry.metrics 로 전송
 *   - 백엔드 자체 수집: navigator.sendBeacon('/metrics', ...)
 */

// 임계값 (모바일 기준) — Lighthouse 90+ 목표
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

export function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    const t = THRESHOLDS[metric.name];
    const rating = !t
      ? 'unknown'
      : metric.value <= t.good
        ? 'good'
        : metric.value <= t.poor
          ? 'needs-improvement'
          : 'poor';

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- dev 디버그 전용 vitals 로깅
      console.log(
        `[vitals] ${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)} (${rating})`,
      );
    }

    // 운영 전송 예시 (도입 시 활성화):
    //
    // 1) navigator.sendBeacon (페이지 떠나기 직전에도 안전)
    //    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    //      const body = JSON.stringify({ ...metric, rating, pathname: location.pathname });
    //      navigator.sendBeacon('/api/metrics', body);
    //    }
    //
    // 2) Sentry (도입 시):
    //    Sentry.metrics.distribution(`web_vitals.${metric.name}`, metric.value, {
    //      tags: { rating, pathname: location.pathname },
    //    });
    //
    // 3) Vercel Analytics: 자동 통합 — 별도 코드 불필요
  });

  return null;
}
