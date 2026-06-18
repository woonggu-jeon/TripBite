import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trip-bite-mxue.vercel.app';

/**
 * /robots.txt
 *
 * 두 가지 모드:
 *   1) 차단 모드 (default 또는 NEXT_PUBLIC_USE_MSW=true / NEXT_PUBLIC_BLOCK_INDEXING=true):
 *      - 모든 경로 disallow
 *      - 데모/스테이징/QA 노출이지만 검색엔진 색인 X
 *   2) 공개 모드 (env 둘 다 'false' 또는 미설정 + 추후 실 백엔드 운영 시):
 *      - 공개 페이지만 허용, 인증/개인 페이지 disallow
 *
 * 보강:
 *   - layout.tsx metadata.robots 도 noindex 부여 (HTML meta 차원)
 *   - next.config.js 의 X-Robots-Tag 헤더도 함께 차단 (robots.txt 무시 봇 대응)
 */
const BLOCK_INDEXING =
  process.env.NEXT_PUBLIC_USE_MSW === 'true' ||
  process.env.NEXT_PUBLIC_BLOCK_INDEXING === 'true';

export default function robots(): MetadataRoute.Robots {
  if (BLOCK_INDEXING) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/signup',
          '/find-id',
          '/forgot-password',
          '/reset-password',
          '/onboarding',
          '/mypage',
          '/settings',
          '/letter/compose',
          '/letter/', // 상세는 사용자별이라 제외
          '/quiz/result', // 사용자별 결과 — HTML meta robots noindex 와 이중 가드
          '/quiz/share', // 사용자별 공유 카드 — HTML meta robots noindex 와 이중 가드
          '/tournament/play', // 진행 중 상태 의존
          '/tournament/result', // 사용자별 우승지
          '/dev/',
          '/offline',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
