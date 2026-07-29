'use client';

import {
  type DefaultOptions,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Toaster } from '@/components/feedback/Toaster';
import { WebVitalsTracker } from '@/features/analytics/components/web-vitals';
import { usePageView } from '@/features/analytics/hooks/use-page-view';
import { SessionExpiredWatcher } from '@/features/auth/components/SessionExpiredWatcher';
import { ServiceWorkerNavigateBridge } from '@/features/notification/components/ServiceWorkerNavigateBridge';
import {
  InstallPromptBanner,
  OfflineBanner,
  PwaUpdateBanner,
} from '@/features/pwa';
// 2026-06-12 — AuthBootstrap mount 비활성. 인증 redirect 는 middleware (SSR) +
// interceptor (401) 가 담당, 로그인 직후 store sync 는 useLogin.onSuccess 의
// fetchQuery 가 처리. 다른 기기 user 변경 stale 만 trade-off (다음 navigation 까지).
// 회귀 시 본 import 와 아래 <AuthBootstrap /> mount 주석 복원.
// import { AuthBootstrap } from '@/features/auth/components/AuthBootstrap';
import { ThemeApplier } from '@/features/theme/components/ThemeApplier';
import {
  installGlobalErrorReporters,
  reportClientError,
} from '@/lib/client-error-reporter';
import { createLogger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { isAxiosError } from '@/services/interceptors/auth';

/**
 * react-query 정책:
 *   - staleTime 1m / gcTime 5m 기본 (개별 hook 이 CACHE 프로파일로 override)
 *   - refetchOnWindowFocus false — PWA 의 OS 탭 전환 시 불필요 폴링 방지
 *   - retry — 4xx (deterministic 에러) 는 재시도 X, 5xx/network 만 1회.
 *     401/422 같은 비번 틀림 / 유효성 위반은 재시도해도 동일 결과 → 무한 hang 방지.
 *   - mutation retry 0 — POST/PATCH 는 멱등성 보장 안 되어 재시도 위험.
 */
const queryClientOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status =
        (error as { response?: { status?: number } })?.response?.status ?? 0;
      // 4xx 는 deterministic — 한 번에 fail. 5xx / network (status=0) 만 1회 재시도.
      if (status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  },
  mutations: { retry: 0 },
};

/**
 * 전역 Provider
 *
 * 마운트되는 글로벌 UI / 부수효과:
 *   - QueryClientProvider — TanStack Query
 *   - (인증 redirect 는 middleware (SSR) 담당 — AuthBootstrap mount 비활성)
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

const log = createLogger('providers');

// 빌드 시점에 inline 된 env 상태를 클라이언트에 한 줄로 노출 (트러블슈팅용).
// Next.js 가 NEXT_PUBLIC_* 를 빌드 시 치환 → 런타임에 `process.env` 직접 접근 불가.
// 로그에서 이 줄을 확인해 Vercel env 가 실제 빌드에 들어갔는지 즉시 판별.
if (typeof window !== 'undefined') {
  log.info(
    {
      mswEnabled: MSW_ENABLED,
      useMsw: process.env.NEXT_PUBLIC_USE_MSW,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    },
    'boot',
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // queryCache.onError 안에서 i18n 메시지 사용 — useState lazy init 의 closure
  // stale 회피 위해 ref 패턴. 매 호출 시 latest t.
  const tErrors = useTranslations('errors');
  const tErrorsRef = useRef(tErrors);
  tErrorsRef.current = tErrors;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryClientOptions,
        // 글로벌 query 에러 → toast.
        // 401은 axios interceptor 가 /login redirect 처리 중이라 skip.
        // mutation 에러는 각 폼에서 setError로 root 표시 → 자동 toast 중복 방지(여기 제외).
        queryCache: new QueryCache({
          onError: (error) => {
            if (isAxiosError(error) && error.response?.status === 401) return;
            const t = tErrorsRef.current;
            // attachErrorNormalizeInterceptor 가 error.normalized 부착 — cast 우회.
            const message = isAxiosError(error)
              ? (error.normalized?.message ?? t('requestFailed'))
              : t('network');
            toast.error(message);
            // 운영 client-error endpoint 로 보고. dev 는 console 만.
            // 4xx (보통 검증 실패) 는 skip — server 측 정합 issue 가 아니라 사용자 입력.
            const status = isAxiosError(error)
              ? error.response?.status
              : undefined;
            if (status === undefined || status >= 500) {
              reportClientError('react-query', error);
            }
          },
        }),
        // 글로벌 mutation 에러 → 관측 로깅만 (toast 는 각 폼이 담당 — 중복 방지).
        // 5xx / 네트워크만 보고(4xx 는 사용자 입력 검증). 401 은 interceptor 처리.
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isAxiosError(error) && error.response?.status === 401) return;
            const status = isAxiosError(error)
              ? error.response?.status
              : undefined;
            if (status === undefined || status >= 500) {
              reportClientError('react-query', error);
            }
          },
        }),
      }),
  );
  const [mswReady, setMswReady] = useState(!MSW_ENABLED);

  // 운영 client-error 수집 — window.onerror / unhandledrejection 글로벌 핸들러.
  // dev 는 console 로만, production 빌드에서만 endpoint POST. installed flag 로 idempotent.
  useEffect(() => {
    installGlobalErrorReporters();
  }, []);

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
          log.warn(
            { err },
            'MSW worker 등록 실패 — 앱은 진행하되 API 호출이 실 백엔드로 갑니다',
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
      <ThemeApplier />
      {/* <AuthBootstrap /> — 2026-06-12 비활성 (위 import 코멘트 참조) */}
      <SessionExpiredWatcher />
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

      {/* DEMO chip / mock push trigger 는 AppHeader 좌측 dev slot 으로 이동
          (mock 환경 한정). providers 에서는 PWA 배너만 mount. */}

      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
