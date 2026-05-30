import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from './providers';
import './globals.scss';
// keen-slider base CSS — dynamic chunk 로 늦게 로드되면 슬라이드가 stacked 됐다가
// CSS 적용 시점에 layout 점프. root layout 에서 즉시 로드.
import 'keen-slider/keen-slider.min.css';

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

  return {
    title: {
      default: t('logo'),
      template: `%s | ${t('logo')}`,
    },
    description: 'Next.js 15 + PWA + JWT Cookie Auth',
    manifest: '/manifest.json',
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

/**
 * 한글 웹폰트 설정 자리 (next/font)
 *
 * 실제 폰트 파일을 추가한 후 활성화:
 *   1) Pretendard 등 .woff2 파일을 public/fonts/ 또는 src/fonts/ 에 둠
 *   2) 아래 import 활성화 + className 적용
 *
 * Subset 권장:
 *   pyftsubset Pretendard-Variable.woff2 \
 *     --unicodes="U+AC00-D7AF,U+0020-007F,U+1100-11FF" \
 *     --output-file=Pretendard-KO.woff2
 *   → 한글+영문만 추출, ~500KB → ~120KB
 *
 * 또는 next/font/google 의 Noto Sans KR 사용 가능 (간편하나 폰트 크기 큼).
 *
 * 예시 (코멘트 풀어 사용):
 *
 * import localFont from 'next/font/local';
 *
 * const pretendard = localFont({
 *   src: '../fonts/Pretendard-KO.woff2',
 *   display: 'swap',              // FOIT 방지 — 시스템 폰트로 즉시 표시 후 교체
 *   preload: true,                // <link rel=preload> 자동
 *   variable: '--font-sans',      // globals.scss 의 --font-sans 와 매핑
 *   weight: '100 900',            // variable font
 * });
 *
 * → <html lang={locale} className={pretendard.variable}>
 */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <html lang={locale}>
      <head>
        {/*
          Resource hints — 첫 페인트 직후 외부 도메인 연결을 미리 시작.
          DNS 조회 + TLS handshake 비용을 critical path 에서 제거.

          preconnect: DNS + TCP + TLS 까지 미리 (HTTP 첫 요청 즉시 시작 가능)
          dns-prefetch: DNS 만 미리 (preconnect 미지원 브라우저 폴백)
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

        {/*
          Pretendard — jsdelivr dynamic-subset
            · unicode-range 로 한글/영문 chunk 자동 분할 다운로드
            · 사용자가 보는 페이지 글리프 범위에 해당하는 woff2 만 받음
            · preconnect + crossOrigin="anonymous" 로 critical path 영향 최소화
            · CSS 자체는 첫 페인트를 막지 않도록 stylesheet 만 사용 (font-display:swap)

          ⚠️ 폰트 파일 preload 는 의도적으로 안 함:
            dynamic-subset 은 unicode-range 기반으로 여러 chunk 로 분할되어
            어떤 파일이 필요한지 빌드 시점에 알 수 없음.
            잘못된 chunk preload 는 비용 낭비.
            preconnect 만으로도 충분히 빠르며, font-display:swap 으로 FOIT 방지.

          Self-host 마이그레이션 시:
            단일 파일이므로 <link rel="preload" as="font" type="font/woff2"
                href="/fonts/Pretendard-KO.woff2" crossorigin /> 추가 가능.
        */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
