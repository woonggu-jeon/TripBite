import type { MetadataRoute } from 'next';
import { CHUNGBUK_REGIONS } from '@/constants/regions';

/**
 * /sitemap.xml — 검색 엔진 색인 대상 경로.
 *
 * 정적 + dynamic:
 *   - 정적: 홈/랭킹/지역지도/토너먼트/유형테스트/정책
 *   - dynamic: 11 시군 상세 (`/region/[code]`).
 *
 * destination 상세 (`/destination/[id]`) 는 mock 기반으로 N=88+ 이라 sitemap 노출 X.
 * BE 합류 후 실 destination 목록 fetch 해서 동적 추가 가능 (next.js sitemap.ts 는 async 지원).
 *
 * 인증 페이지·정책은 검색 노출 가치 적어 제외하거나 낮은 우선순위로.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trip-bite-mxue.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/ranking`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/region`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tournament`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/quiz`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/policy/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/policy/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // 11 시군 상세 — 각 페이지가 시군별 관광지/축제/체험 콘텐츠를 가짐.
  const regionUrls: MetadataRoute.Sitemap = CHUNGBUK_REGIONS.map((r) => ({
    url: `${SITE_URL}/region/${r.code}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...regionUrls];
}
