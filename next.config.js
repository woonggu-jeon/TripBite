const createNextIntlPlugin = require('next-intl/plugin');

/**
 * Serwist PWA (next-pwa 대체 — 유지보수 중단/workbox6 → serwist workbox 최신)
 * SW 소스: src/app/sw.ts (runtimeCaching은 거기서 정의). dev에선 비활성.
 */
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * 보안 헤더 (정적 — 모든 응답)
 *
 * - Strict-Transport-Security: HTTPS 강제 (preload 등록 가능)
 * - X-Content-Type-Options: MIME sniffing 차단
 * - X-Frame-Options: 클릭재킹 방어 (iframe 임베드 차단)
 * - Referrer-Policy: 외부로 referrer 최소화
 * - Permissions-Policy: 사용 안 하는 권한 명시적 거부
 *
 * CSP는 요청별 nonce가 필요해 정적 헤더로 둘 수 없음 →
 * middleware.ts + src/lib/csp.ts 에서 발급 (Content-Security-Policy-Report-Only).
 */
// 검색엔진 색인 차단 토글 — mock 모드(NEXT_PUBLIC_USE_MSW=true) 또는 명시
// NEXT_PUBLIC_BLOCK_INDEXING=true 일 때 X-Robots-Tag 부여.
// 실 운영(env 둘 다 OFF) 시 헤더 미추가 → 정상 색인 허용.
const BLOCK_INDEXING =
  process.env.NEXT_PUBLIC_USE_MSW === 'true' ||
  process.env.NEXT_PUBLIC_BLOCK_INDEXING === 'true';

const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ...(BLOCK_INDEXING
    ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]
    : []),
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
    // Client Router Cache TTL — 재방문/뒤로가기 시 캐시된 RSC payload 재사용.
    // dynamic 30s / static 180s. 탭 전환 잦은 PWA에서 즉각 복귀 체감.
    staleTimes: { dynamic: 30, static: 180 },
    // <Link href>/router.push() 경로를 컴파일 시점에 검증 (오타로 깨진 링크 차단)
    typedRoutes: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'keen-slider',
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

module.exports = withSerwist(withNextIntl(withBundleAnalyzer(nextConfig)));

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
