'use client';

import {
  QueryClient,
  QueryCache,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { isAxiosError } from '@/services/interceptors/auth';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
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

/**
 * MSW worker 초기 상태:
 *   - production 또는 토글 OFF면 ready=true (즉시 렌더)
 *   - dev + 토글 ON이면 ready=false → useEffect 안에서 worker.start() 완료 후 true
 *
 * dev에서 첫 렌더가 잠시 빈 화면이 되는 비용은 감수 (백엔드 mock 호출 누락 방지).
 */
const MSW_ENABLED =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_USE_MSW === 'true';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryClientOptions,
        // 글로벌 query 에러 → toast.
        // 401은 axios interceptor가 /auth/refresh 처리 중이라 skip.
        // mutation 에러는 각 폼에서 setError로 root 표시 → 자동 toast 중복 방지(여기 제외).
        queryCache: new QueryCache({
          onError: (error) => {
            if (isAxiosError(error) && error.response?.status === 401) return;
            const message = isAxiosError(error)
              ? ((error.response?.data as { message?: string })?.message ??
                '요청을 처리하지 못했어요.')
              : '네트워크 오류가 발생했어요.';
            toast.error(message);
          },
        }),
      }),
  );
  const [mswReady, setMswReady] = useState(!MSW_ENABLED);

  useEffect(() => {
    if (!MSW_ENABLED || mswReady) return;
    let cancelled = false;
    void (async () => {
      const { worker } = await import('@/mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
      if (!cancelled) setMswReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mswReady]);

  if (!mswReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <PageViewTracker />
      {/* dev 디버그용 콘솔 로깅만. 운영 Web Vitals 수집은 SpeedInsights 담당(중복 방지) */}
      {process.env.NODE_ENV === 'development' && <WebVitalsTracker />}
      <SpeedInsights />
      {/* page view 자동 추적. custom event는 features/analytics의 vercelProvider */}
      <Analytics />
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
