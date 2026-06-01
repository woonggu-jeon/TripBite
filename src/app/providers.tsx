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
import { ServiceWorkerNavigateBridge } from '@/features/notification/components/ServiceWorkerNavigateBridge';
import { MockPushTrigger } from '@/features/notification/components/MockPushTrigger';
import { Toaster } from '@/components/feedback/Toaster';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import {
  PwaUpdateBanner,
  OfflineBanner,
  InstallPromptBanner,
  MockModeBanner,
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
 * MSW worker 활성화 조건 — NODE_ENV 무관, env 토글로만 결정.
 *
 *   ▸ NEXT_PUBLIC_USE_MSW=true 면 dev / preview / prod 어디서든 mock 활성화
 *   ▸ 운영(prod) 활용 시나리오:
 *       - 백엔드 미준비 상태로 데모/마케팅 공개
 *       - 스테이징/QA — 결정적 mock 시드로 회귀 시나리오 재현
 *       - 오프라인 시연
 *   ▸ 주의사항:
 *       - MSW 번들(~80KB) + seeds 가 운영 청크에 포함 → 번들 사이즈 증가
 *       - public/mockServiceWorker.js 가 root scope 에 등록 — Serwist 의 /sw.js 와
 *         별도 파일이라 충돌은 없지만, 두 sw 가 같은 fetch 를 처리하지 않도록
 *         MSW 핸들러 prefix(`/api/backend`)와 Serwist precache 영역을 분리해야 함
 *       - 사용자가 실제 API 와 헷갈리지 않도록 운영 활성화 시 화면에 mock 배너 노출 권장
 *
 * 초기 상태:
 *   - 토글 OFF면 ready=true (즉시 렌더)
 *   - 토글 ON이면 ready=false → worker.start() 완료 후 true
 */
const MSW_ENABLED = process.env.NEXT_PUBLIC_USE_MSW === 'true';

// 빌드 시점에 inline 된 env 상태를 클라이언트 콘솔에 한 줄로 노출 (트러블슈팅용).
// Next.js 가 NEXT_PUBLIC_* 를 빌드 시 치환 → 런타임에 `process.env` 직접 접근 불가.
// 콘솔에서 이 줄을 확인해 Vercel env 가 실제 빌드에 들어갔는지 즉시 판별.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(
    `[boot] MSW_ENABLED=${MSW_ENABLED} ` +
      `NEXT_PUBLIC_USE_MSW=${JSON.stringify(process.env.NEXT_PUBLIC_USE_MSW)} ` +
      `NEXT_PUBLIC_API_URL=${JSON.stringify(process.env.NEXT_PUBLIC_API_URL)}`,
  );
}

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
      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          // public/mockServiceWorker.js 가 root scope 에 등록되도록 명시.
          // Serwist /sw.js 와 별도 파일이라 충돌 없음.
          serviceWorker: { url: '/mockServiceWorker.js' },
        });
      } catch (err) {
        // 운영 환경에서 service worker 등록 실패 시(권한/스코프/네트워크) 앱이 멈추지 않도록.
        // 콘솔에만 경고하고 mswReady=true 로 진행 — 이후 API 호출은 실 백엔드로 감.
        // (실 백엔드 없으면 각 fetch 가 404 → 화면별 에러 UI 가 처리)
        if (typeof window !== 'undefined') {
          console.warn(
            '[mock] MSW worker 등록 실패 — 앱은 진행하되 API 호출이 실 백엔드로 갑니다.',
            err,
          );
        }
      }
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
      <ServiceWorkerNavigateBridge />
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

      {/* 운영에서 mock 활성화 시 사용자에게 DEMO 모드임을 알리는 작은 chip */}
      {MSW_ENABLED && <MockModeBanner />}
      {/* mock 모드 전용 — 새 편지 도착 시뮬레이션 dev 버튼. */}
      {MSW_ENABLED && <MockPushTrigger />}

      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
