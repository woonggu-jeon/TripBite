import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from './providers';
import { getApiOrigin } from '@/lib/api-origin';
import { JsonLd, webSiteOrganization } from '@/lib/json-ld';
import './globals.scss';

/**
 * Pretendard 한글 웹폰트 — self-host (next/font/local).
 *
 * 이전: jsdelivr CDN dynamic-subset (CSS render-blocking + 외부 의존).
 * 이후: variable woff2 단일 파일 self-host. next/font 가 build 시 inline
 * @font-face + 자동 preload + zero CLS 보장.
 *
 * 한국어 사용자 첫 진입 1회 다운로드 (~2MB) 후 영구 캐시 → 다음 진입 0 비용.
 * `--font-sans` CSS 변수로 globals.scss 의 font-family fallback chain 연결.
 */
const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  preload: true,
  variable: '--font-sans-loaded',
  weight: '45 920',
});

/**
 * 다국어 메타데이터 — generateMetadata 에서 getTranslations 사용
 */
/**
 * 검색엔진 색인 차단 토글.
 *   - mock 데이터 모드 (NEXT_PUBLIC_USE_MSW=true) 또는
 *     명시적 NEXT_PUBLIC_BLOCK_INDEXING=true 면 noindex/nofollow.
 *   - 실 운영 시 두 env 모두 끄면 정상 색인 허용.
 *
 * 다층 방어:
 *   1) robots.ts 가 robots.txt 에서 disallow
 *   2) 본 metadata 가 HTML <meta name="robots"> 부여
 *   3) next.config.js 의 X-Robots-Tag 헤더 (robots.txt 무시 봇 대응)
 */
const BLOCK_INDEXING =
  process.env.NEXT_PUBLIC_USE_MSW === 'true' ||
  process.env.NEXT_PUBLIC_BLOCK_INDEXING === 'true';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('header');
  const tMeta = await getTranslations('meta');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const description = tMeta('description');
  const keywords = tMeta('keywords');
  const ogTitle = tMeta('ogTitle');

  return {
    title: {
      default: t('logo'),
      template: `%s | ${t('logo')}`,
    },
    description,
    keywords,
    manifest: '/manifest.json',
    ...(siteUrl && { metadataBase: new URL(siteUrl) }),
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      siteName: t('logo'),
      ...(siteUrl && { url: siteUrl }),
      images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['/icons/icon-512x512.png'],
    },
    ...(BLOCK_INDEXING && {
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true },
      },
    }),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: t('logo'),
      // iOS PWA splash 이미지 — iOS Safari 는 manifest 의 background_color/
      // icons 로 splash 자동 생성 X. 디바이스별 media query 로 portrait splash
      // PNG 매칭. 이미지는 scripts/generate-ios-splash.mjs 로 생성 (sharp 기반,
      // public/splash/*.png). 디바이스 매트릭스 추가 시 스크립트의 DEVICES +
      // 본 startupImage 동시 갱신.
      startupImage: [
        {
          url: '/splash/iphone-se.png',
          media:
            '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-8-plus.png',
          media:
            '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-x-xs-11pro.png',
          media:
            '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-xr-11.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-11pro-max.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-12-mini.png',
          media:
            '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-12-13-14.png',
          media:
            '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-14-pro-max.png',
          media:
            '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/iphone-15-pro-max.png',
          media:
            '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
        },
        {
          url: '/splash/ipad-mini.png',
          media:
            '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
        {
          url: '/splash/ipad.png',
          media:
            '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
        {
          url: '/splash/ipad-pro-11.png',
          media:
            '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
        {
          url: '/splash/ipad-pro-12_9.png',
          media:
            '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
        },
      ],
    },
    formatDetection: { telephone: false },
    icons: {
      icon: '/icons/icon-192x192.png',
      apple: '/icons/icon-192x192.png',
    },
  };
}

/**
 * Viewport — 접근성(WCAG) 준수.
 * Lighthouse 가 user-scalable=no / maximum-scale<5 를 a11y 위반으로 감지.
 * 시각 약자가 핀치 줌으로 확대해야 하므로 5x 이상 + 사용자 확대 허용 필수.
 *
 * iOS Safari 의 input focus auto-zoom 은 별도 패턴 (input font-size ≥ 16px)
 * 으로 해결 — Pretendard + --text-base (1rem = 16px) 라 안전.
 */
export const viewport: Viewport = {
  // light/dark prefers-color-scheme 별 status bar 색 분기.
  // 값은 tokens/_color.scss (--color-bg light) + _dark.scss (--color-bg dark) 와 동기.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  // iOS/Android 가상 키보드 등장 시 viewport 재계산 — `100dvh` 가 키보드 영역
  // 위까지 줄어 input 이 가려지지 않음. 미지원 브라우저는 그대로 동작.
  interactiveWidget: 'resizes-content',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  // preconnect 는 origin 만 받음 — path 포함 시 무효 (DNS/TLS 안 잡힘).
  const apiOrigin = getApiOrigin();
  const apiUrl = apiOrigin || undefined;

  return (
    <html lang={locale} className={pretendard.variable}>
      <head>
        {/*
          Resource hints — 첫 페인트 직후 외부 도메인 연결을 미리 시작.
          DNS 조회 + TLS handshake 비용을 critical path 에서 제거.

          Pretendard 는 self-host (next/font/local) 라 preconnect 불필요.
          jsdelivr 의존 제거 (2026-06-14) — 외부 도메인 1 감소.
        */}
        <link rel="preconnect" href="https://tong.visitkorea.or.kr" />
        <link rel="dns-prefetch" href="https://tong.visitkorea.or.kr" />
        {apiUrl && (
          <>
            <link
              rel="preconnect"
              href={apiUrl}
              crossOrigin="use-credentials"
            />
            <link rel="dns-prefetch" href={apiUrl} />
          </>
        )}

        {/* JSON-LD 구조화 데이터 — WebSite + Organization.
            search 박스 (potentialAction) 는 site search 미구현이라 omit.
            JsonLd 가 BLOCK_INDEXING 모드면 자체 미렌더. */}
        <JsonLd
          data={webSiteOrganization({
            name: 'TripBite',
            inLanguage: ['ko', 'en'],
            logoPath: '/icons/icon-512x512.png',
          })}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
