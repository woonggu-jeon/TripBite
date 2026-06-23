import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { isRegionCode, type RegionCode } from '@/constants/regions';
import { RegionHero } from '@/features/region';
import { JsonLd, breadcrumbList } from '@/lib/json-ld';
import { RegionDetailTabs } from './_components/RegionDetailTabs';
import styles from './page.module.scss';

// dynamic rendering — i18n cookies() 가 static generation 과 incompatible.
// loading.tsx 가 cold start UX 보완. 11 시군은 notFound 가드로 검증.

/**
 * 시군 상세 페이지 (/region/[code])
 *
 * 구성:
 *   - SubHeader: "{시군명}"
 *   - 헤더 영역: 대표 이미지 (OptimizedImage, priority), 한 줄 소개
 *   - 탭: 관광지 / 축제 / 체험
 *     · 각 탭 콘텐츠는 InfiniteList (TourAPI 페이지네이션)
 *     · 탭 전환 시 URL 쿼리(?tab=festival) 동기화 권장 — 새로고침/공유 시 유지
 *   - 하단 CTA: "이 시군으로 토너먼트 시작"
 *     · 클릭 시 useTournamentStore.setConfig({ region: code, ... }) + router.push('/tournament')
 *
 * 성능:
 *   - params는 await — Next.js 15 동적 라우트
 *   - 잘못된 코드는 notFound() (정적 라우트 verifier 역할도 겸함)
 *   - 데이터는 client tabs 내부에서 useInfiniteList
 *   - 대표 이미지에만 priority (LCP), 리스트 썸네일은 lazy
 */

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  if (!isRegionCode(code)) return {};
  const t = await getTranslations('region.names');
  const name = t(code as Parameters<typeof t>[0]);
  const description = `${name} · 관광지 · 축제 · 체험 가이드`;
  const ogImage = `/api/og/region?code=${encodeURIComponent(code)}`;

  return {
    title: name,
    description,
    alternates: {
      // 시군 상세는 query (탭 등) 없이도 동일 콘텐츠 — canonical 로 정규화.
      canonical: `/region/${code}`,
    },
    openGraph: {
      title: name,
      description,
      url: `/region/${code}`,
      images: [{ url: ogImage, width: 1080, height: 1080 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [ogImage],
    },
  };
}

export default async function RegionDetailPage({ params }: Props) {
  const { code } = await params;
  if (!isRegionCode(code)) notFound();

  const validCode: RegionCode = code;
  const tNames = await getTranslations('region.names');
  const tNav = await getTranslations('nav');
  const tRegion = await getTranslations('region');
  const name = tNames(validCode as Parameters<typeof tNames>[0]);

  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: tNav('home'), url: '/' },
          { name: tRegion('title'), url: '/region' },
          { name, url: `/region/${validCode}` },
        ])}
      />
      {/* Figma "Header type=location" 의 rightSlot (share/북마크) 는 의도적
          미전달 — destination/[id] 선례 동일. 공유/저장 action 은 본문
          (RegionDetailTabs 하단 CTA 영역) 으로 이동해 헤더 단순화. */}
      <SubHeader title={name} />
      {/* Figma body — padding 20 20 0 gap 16. contentInner padding 16 + body
          padding 4 = 20 (Figma), gap 16 = banner ↔ tabs 사이 spacing 정합. */}
      <div className={styles.body}>
        <RegionHero code={validCode} />
        <RegionDetailTabs code={validCode} />
      </div>
    </>
  );
}
