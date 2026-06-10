import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from './providers';
import { getApiOrigin } from '@/lib/api-origin';
import { JsonLd, webSiteOrganization } from '@/lib/json-ld';
import './globals.scss';

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
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  // iOS/Android 가상 키보드 등장 시 viewport 재계산 — `100dvh` 가 키보드 영역
  // 위까지 줄어 input 이 가려지지 않음. 미지원 브라우저는 그대로 동작.
  interactiveWidget: 'resizes-content',
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

  // preconnect 는 origin 만 받음 — path 포함 시 무효 (DNS/TLS 안 잡힘).
  const apiOrigin = getApiOrigin();
  const apiUrl = apiOrigin || undefined;

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
        {/* Pretendard CSS — jsdelivr CDN.
            SRI: 운영 배포 전 NEXT_PUBLIC_PRETENDARD_SRI 환경변수에 SHA-384 해시
            주입 (`curl -s "..." | openssl dgst -sha384 -binary | openssl base64 -A`).
            미설정 시 integrity 속성 생략 — 호환 우선, 보안 약간 감소.
            crossOrigin="anonymous" 는 SRI 동작에 필수. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
          {...(process.env.NEXT_PUBLIC_PRETENDARD_SRI
            ? { integrity: process.env.NEXT_PUBLIC_PRETENDARD_SRI }
            : {})}
        />

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
