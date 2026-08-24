import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render, renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import messages from '@/i18n/messages/ko.json';

/**
 * 테스트 헬퍼 — next-intl + TanStack Query Provider 주입.
 *
 *   renderWithProviders(<LoginForm />);
 *   const { result } = renderHookWithProviders(() => useFoo());
 *
 * - 테스트마다 새 QueryClient (retry:false, gcTime:0 — 테스트 격리)
 * - 기본 locale 'ko' (ko.json 메시지)
 * - 추가 Provider 가 필요하면 옵션의 `wrapper` 로 합성
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

type TestProviderProps = {
  children: ReactNode;
  locale?: string;
  queryClient?: QueryClient;
};

/**
 * 공용 Provider wrapper — render / renderHook 양쪽에서 재사용.
 * 외부에서 직접 import 해 자체 wrapper 합성 가능.
 */
export function TestProviders({
  children,
  locale = 'ko',
  queryClient,
}: TestProviderProps) {
  const client = queryClient ?? createTestQueryClient();
  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

/**
 * 컴포넌트 render — TestProviders 자동 주입.
 *
 * 옵션:
 *   locale       기본 'ko'. 영어 화면 테스트 시 'en' 등.
 *   queryClient  외부 client 주입 (mutation 캐시 검증 등 특수 케이스).
 *   ...options   testing-library/react 의 render 옵션 그대로 전달.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & {
    locale?: string;
    queryClient?: QueryClient;
  } = {},
) {
  const { locale, queryClient, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders locale={locale} queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
    ...rest,
  });
}

/**
 * Hook 단위 테스트 — useQuery / useMutation / useStore 등.
 *
 *   const { result, rerender } = renderHookWithProviders(() => useLogin());
 *   await act(() => result.current.mutateAsync({ ... }));
 */
export function renderHookWithProviders<T>(
  callback: () => T,
  options: {
    locale?: string;
    queryClient?: QueryClient;
  } = {},
) {
  const { locale, queryClient } = options;
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <TestProviders locale={locale} queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
  });
}

/**
 * `next/navigation` mock helper — useRouter / usePathname / useSearchParams 를 stub.
 *
 * 사용 (테스트 파일 최상단):
 *   import { mockNextNavigation } from '@/test-utils';
 *   const { push, replace, back } = mockNextNavigation({ pathname: '/letter/compose' });
 *
 *   await userEvent.click(screen.getByText('보내기'));
 *   expect(push).toHaveBeenCalledWith('/letter/sent');
 *
 * 주의: vi.mock 은 호이스팅되므로 이 helper 는 mock 함수만 만들고 반환.
 *       실제 mock 은 `vi.mock('next/navigation', ...)` 으로 별도 호출 필요.
 *       또는 아래 setupNextNavigationMock 사용.
 */
type RouterMock = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
};

export function createRouterMock(): RouterMock {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
}
