const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/tong\.visitkorea\.or\.kr\/.+\.(?:jpe?g|png|webp|avif)$/i,
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
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tong.visitkorea.or.kr",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl} https://*.sentry.io`.trim(),
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
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
    optimizePackageImports: ['lucide-react', 'recharts', 'embla-carousel-react'],
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
};

module.exports = withNextIntl(withPWA(nextConfig));
