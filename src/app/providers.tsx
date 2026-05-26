'use client';

import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthBootstrap } from '@/features/auth/components/AuthBootstrap';
import { Toaster } from '@/components/feedback/Toaster';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import {
  PwaUpdateBanner,
  OfflineBanner,
  InstallPromptBanner,
} from '@/features/pwa';
import { usePageView } from '@/features/analytics/hooks/use-page-view';
import { WebVitalsTracker } from '@/features/analytics/web-vitals';

const queryClientOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  },
  mutations: { retry: 0 },
};

/**
 * 전역 Provider
 *
 * 마운트되는 글로벌 UI / 부수효과:
 *   - QueryClientProvider — TanStack Query
 *   - AuthBootstrap        /me 조회 + onboarding redirect
 *   - PageViewTracker      라우트 변경 자동 추적
 *   - Toaster              toast 큐 렌더
 *   - ConfirmDialog        confirm 다이얼로그 큐 렌더
 *   - PwaUpdateBanner      새 SW 감지 시
 *   - OfflineBanner        offline 시
 *   - InstallPromptBanner  설치 가능 + 사용자 미거부 시
 *
 * Zustand 는 글로벌이라 Provider 불필요.
 */

function PageViewTracker() {
  usePageView();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: queryClientOptions }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <PageViewTracker />
      <WebVitalsTracker />
      <SpeedInsights />
      {children}

      {/* 글로벌 피드백 UI */}
      <Toaster />
      <ConfirmDialog />

      {/* PWA 배너들 */}
      <PwaUpdateBanner />
      <OfflineBanner />
      <InstallPromptBanner />

      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
