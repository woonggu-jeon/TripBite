import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import messages from '@/i18n/messages/ko.json';

/**
 * 테스트용 렌더 헬퍼 — next-intl + TanStack Query Provider 주입.
 *
 *   renderWithProviders(<LocationPermissionPrompt onAccept={fn} />);
 *
 * - 테스트마다 새 QueryClient (retry:false, gcTime:0 — 테스트 격리)
 * - 기본 locale 'ko' (ko.json 메시지)
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

export function renderWithProviders(ui: ReactElement, locale = 'ko') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
