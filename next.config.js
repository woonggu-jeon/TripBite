const createNextIntlPlugin = require('next-intl/plugin');

/**
 * Serwist PWA (next-pwa 대체 — 유지보수 중단/workbox6 → serwist workbox 최신)
 * SW 소스: src/app/sw.ts (runtimeCaching은 거기서 정의).
 *
 * dev 토글:
 *   - 기본: dev 에선 비활성 (hot reload 와 SW 캐시 충돌 회피).
 *   - NEXT_PUBLIC_USE_MSW=true 또는 NEXT_PUBLIC_SW_DEV=true 일 때는 dev 에서도
 *     활성화 — Web Push (subscribe / push event / notificationclick) 흐름을
 *     dev 서버에서 end-to-end 확인하기 위함. mock 데모 모드와 일관.
 */
const SW_FORCE_DEV =
  process.env.NEXT_PUBLIC_USE_MSW === 'true' ||
  process.env.NEXT_PUBLIC_SW_DEV === 'true';
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: !SW_FORCE_DEV && process.env.NODE_ENV === 'development',
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
    remotePatterns: [
      { protocol: 'https', hostname: 'tong.visitkorea.or.kr' },
      // 프로필 아바타 — BE(/me/avatar) 가 반환하는 avatarUrl 호스트.
      // 현재 API 오리진과 동일 가정(2026-08). 별도 CDN 으로 옮기면 여기 host 교체.
      { protocol: 'https', hostname: 'trip-bite.o-r.kr' },
    ],
    formats: ['image/avif', 'image/webp'],
    // variant 수 절감 + 우리 sizes prop 의 실 width cover.
    // sizes prop 사용처 widths: 40/64/72/80/96/100/120/160/200/720
    //   → 64/96/128/256/384/512 안에서 round-up 매칭 (next/image 가 imageSizes
    //     외 width 요청 시 400 반환 — 96 누락이 RecommendationBanner 400 원인).
    // 변환 호출 절감 효과는 직전 [16/32/48/64/96/128/256/384] (8개) → 6개로 유지.
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },
  compress: true,
  experimental: {
    // Client Router Cache TTL — 재방문/뒤로가기 시 캐시된 RSC payload 재사용.
    // dynamic 30s / static 180s. 탭 전환 잦은 PWA에서 즉각 복귀 체감.
    staleTimes: { dynamic: 30, static: 180 },
    // <Link href>/router.push() 경로를 컴파일 시점에 검증 (오타로 깨진 링크 차단)
    typedRoutes: true,
    // PPR (Partial Prerendering) 시도 결과 (2026-06-14):
    //   `experimental.ppr = 'incremental'` → build error "can only be enabled
    //   when using the latest canary version of Next.js". 우리 15.5.18 stable
    //   에선 도입 불가. Next 16 stable 출시 후 재검토. 그때까지는 CDN cache +
    //   loading.tsx 가 cold start 정책.
    optimizePackageImports: [
      'lucide-react',
      'embla-carousel-react',
      'next-intl',
      // TanStack Query — Provider 외 hook 별 import tree-shake 보강.
      '@tanstack/react-query',
      // date-fns / react-hook-form / @hey-api/* 는 향후 도입 시 같이 추가.
    ],
  },

  async headers() {
    // public content 페이지의 Vercel CDN cache — ISR 비슷한 효과.
    // i18n 의 cookies() 의존으로 ISR 직접 사용 불가 (DYNAMIC_SERVER_USAGE) 회피 위해
    // HTTP cache 헤더로 대체. 첫 진입 dynamic → CDN cache → 두 번째부터 즉시 paint.
    //
    // 정책:
    //   - s-maxage=3600 — CDN 1h fresh
    //   - stale-while-revalidate=86400 — fresh 만료 후에도 24h 동안 stale 응답 (백그라운드 갱신)
    //   - public — 모든 사용자에게 공유 가능 (user-specific 콘텐츠 없음)
    //
    // 적용 대상 — public + non-user-specific:
    //   /region, /region/[code], /destination/[id], /quiz, /ranking
    // 미적용 대상 — user-specific (cookie 기반 응답 다름):
    //   /mypage/*, /settings/*, /letter/*, /notifications, /tournament/*
    //   /quiz/result — 사용자별 결과 (user-specific)
    const CDN_CACHE = {
      key: 'Cache-Control',
      value: 'public, s-maxage=3600, stale-while-revalidate=86400',
    };
    return [
      {
        // 모든 경로
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      { source: '/region', headers: [CDN_CACHE] },
      { source: '/region/:code', headers: [CDN_CACHE] },
      { source: '/destination/:id', headers: [CDN_CACHE] },
      { source: '/quiz', headers: [CDN_CACHE] },
      { source: '/ranking', headers: [CDN_CACHE] },
    ];
  },

  /**
   * Same-origin proxy — `/api/backend/*` → BE.
   *
   * **운영 / dev 모두 활성**:
   *   - 운영: Chrome 시크릿 모드 + 향후 3rd-party cookie phase-out 대응.
   *     `vercel.app` ↔ `duckdns.org` 가 cross-site → cookie 차단 → proxy 통해
   *     same-site (vercel.app) 로 통합. axios baseURL=/api/backend.
   *   - dev MSW: service worker 가 same-origin scope 만 intercept — proxy 패턴 필수.
   *
   * 경로 매핑:
   *   - axios interceptor 가 generated 의 `/v1/...` 를 `/...` 로 제거 (`client.ts:46`)
   *   - rewrite destination 은 path 만 전달 (`${target}/:path*`)
   *   - 운영 env `NEXT_PUBLIC_API_URL` 말미에 `/v1` 포함 가정
   *     (예: `https://tripbite.duckdns.org/v1`) → final URL 이 BE `/v1/` 매핑.
   */
  async rewrites() {
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
    console.warn(
      '[next.config] ANALYZE=true 인데 @next/bundle-analyzer 가 설치 안 됨.\n' +
        '  npm i -D @next/bundle-analyzer 후 다시 시도하세요.',
    );
  }
}

module.exports = withSerwist(withNextIntl(withBundleAnalyzer(nextConfig)));
