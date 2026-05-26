import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from './providers';
import './globals.scss';

/**
 * 메타데이터도 다국어 — generateMetadata 에서 getTranslations 사용
 *
 * 정적 metadata 객체와 generateMetadata 함수는 같이 export할 수 없으므로
 * 다국어가 필요하면 generateMetadata 만 사용합니다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('header');

  return {
    title: {
      default: t('logo'),
      template: `%s | ${t('logo')}`,
    },
    description: 'Next.js 15 + PWA + JWT Cookie Auth',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      // black-translucent: 컨텐츠가 status bar 영역까지 확장 (viewportFit=cover와 결합)
      statusBarStyle: 'black-translucent',
      title: t('logo'),
    },
    formatDetection: { telephone: false },
    icons: {
      icon: '/icons/icon-192x192.png',
      apple: '/icons/icon-192x192.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // next-intl 가 request.ts 의 설정을 통해 자동으로 현재 locale/messages 제공
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        {/*
          NextIntlClientProvider 는 클라이언트 컴포넌트에 메시지를 전달합니다.
          서버 컴포넌트는 getTranslations() 로 직접 접근하므로 Provider 불필요.

          messages 전체를 내려보내면 번들에 모든 키가 포함됩니다.
          민감하거나 큰 카테고리는 pick() 으로 선택 전송 가능:
            const messages = await getMessages();
            const clientMessages = pick(messages, ['nav', 'header', 'common']);
        */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
