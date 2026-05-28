import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trip-bite-mxue.vercel.app';

/**
 * /robots.txt
 * - 인증/개인 페이지·API는 색인 제외
 * - 공개 페이지(홈/랭킹/지역/정책 등)는 허용
 * - sitemap 위치 명시
 */
export default function robots(): MetadataRoute.Robots {
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
          '/dev/',
          '/offline',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
