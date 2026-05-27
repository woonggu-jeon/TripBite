const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // jsdelivr Pretendard 폰트 — CacheFirst 1년
      // 첫 진입 시 한 번 다운로드, 이후 모든 페이지 즉시 표시
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.+\.(?:woff2?|css)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pretendard-fonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] }, // opaque 응답도 캐시
      },
    },
    {
      urlPattern: /\/icons\.svg$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'icon-sprite',
        expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern:
        /^https:\/\/tong\.visitkorea\.or\.kr\/.+\.(?:jpe?g|png|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tour-api-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /\.(?:jpe?g|png|webp|avif|svg|gif)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-images',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.+/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Content Security Policy
 *
 * 시작은 Report-Only — 위반 보고만 받고 차단 X.
 * 운영 안정화 후 'Content-Security-Policy' 헤더로 전환.
 *
 * 'unsafe-inline' 가 남는 이유:
 *   - Next.js 가 inline style/script 일부 사용 (이미지 placeholder, CSS-in-JS 등)
 *   - Recharts 가 inline style 사용
 *   → 향후 middleware nonce 패턴으로 발전시킬 수 있음 (README 참고)
 *
 * connect-src 에 백엔드 URL과 Sentry 도메인 명시 (사용 시 추가).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // jsdelivr — Pretendard 폰트 CSS
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://tong.visitkorea.or.kr",
  // jsdelivr — Pretendard 폰트 woff2 파일들
  "font-src 'self' data: https://cdn.jsdelivr.net",
  `connect-src 'self' ${apiUrl} https://*.sentry.io https://vitals.vercel-insights.com`.trim(),
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  isDev ? '' : 'upgrade-insecure-requests',
]
  .filter(Boolean)
  .join('; ');

/**
 * 보안 헤더
 *
 * - Strict-Transport-Security: HTTPS 강제 (preload 등록 가능)
 * - X-Content-Type-Options: MIME sniffing 차단
 * - X-Frame-Options: 클릭재킹 방어 (iframe 임베드 차단)
 * - Referrer-Policy: 외부로 referrer 최소화
 * - Permissions-Policy: 사용 안 하는 권한 명시적 거부
 * - Content-Security-Policy-Report-Only: XSS 완화 (모니터링 단계)
 */
const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'geolocation=(self)',
      'notifications=(self)',
      'camera=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'interest-cohort=()',
    ].join(', '),
  },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  sassOptions: {
    includePaths: ['./src/styles'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'tong.visitkorea.or.kr' }],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },
  compress: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'embla-carousel-react',
      'next-intl',
    ],
  },

  async headers() {
    return [
      {
        // 모든 경로
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },

  /**
   * MSW same-origin proxy
   *
   * Service worker는 same-origin scope만 가로채므로 cross-origin 백엔드
   * (NEXT_PUBLIC_API_URL=http://localhost:8080 등) 호출은 MSW가 못 잡음.
   *
   * dev MSW 모드(NEXT_PUBLIC_USE_MSW=true)에서만 /api/backend/* 를
   * 실 백엔드로 proxy → axios baseURL을 /api/backend 로 두면 same-origin이 되어
   * MSW가 가로챔. 매칭 안 되는 path는 onUnhandledRequest='bypass'로 destination 도달.
   *
   * MSW 미사용 시 rewrites 빈 배열 — production에선 axios가 직접 cross-origin 호출.
   */
  async rewrites() {
    if (process.env.NEXT_PUBLIC_USE_MSW !== 'true') return [];
    const target = process.env.NEXT_PUBLIC_API_URL;
    if (!target) return [];
    return [
      {
        source: '/api/backend/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
};

/**
 * Bundle Analyzer — ANALYZE=true 시점에만 활성화
 *
 * 사용:
 *   ANALYZE=true npm run build
 *   → .next/analyze/*.html 자동 열림 — 청크별 크기/구성 확인
 *
 * 미설치 상태에서 ANALYZE 미지정이면 no-op (require 안 함).
 * 설치: npm i -D @next/bundle-analyzer
 */
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
  } catch {
    // eslint-disable-next-line no-console
    console.warn(
      '[next.config] ANALYZE=true 인데 @next/bundle-analyzer 가 설치 안 됨.\n' +
        '  npm i -D @next/bundle-analyzer 후 다시 시도하세요.',
    );
  }
}

module.exports = withNextIntl(withBundleAnalyzer(withPWA(nextConfig)));

/**
 * Sentry 소스맵 업로드 (릴리스 추적) — 운영 도입 시 활성화
 *
 * 현재는 instrumentation.ts / instrumentation-client.ts 의 런타임 init만으로
 * 에러 캡처가 동작 (DSN 가드). 소스맵 업로드는 빌드에 SENTRY_AUTH_TOKEN 필요.
 *
 * 활성화:
 *   const { withSentryConfig } = require('@sentry/nextjs');
 *   module.exports = withSentryConfig(module.exports, {
 *     org: 'your-org',
 *     project: 'tripbite',
 *     silent: !process.env.CI,
 *     // authToken: process.env.SENTRY_AUTH_TOKEN (CI secret)
 *   });
 */
