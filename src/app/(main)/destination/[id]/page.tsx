import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { destinationSeeds } from '@/mocks/seeds/destinations';
import { regionContentSeeds } from '@/mocks/seeds/regions';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { JsonLd, breadcrumbList, touristAttraction } from '@/lib/json-ld';
import { DestinationDetailClient } from './_components/DestinationDetailClient';

// On-demand ISR — id 가 다수 (TourAPI 전체) 라 build 시 pre-generate 안 함.
// 첫 진입 시 generate → 1h 캐시 → 두 번째부터 즉시 paint (Lambda cold start 회피).
// URL prefix 기반 i18n 도입으로 cookies() 의존 제거 → static generation 호환.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams(): { id: string }[] {
  return [];
}

/**
 * 여행지 상세 (/destination/[id])
 *
 * 진입 경로:
 *   - 시군 상세 (/region/[code]) 의 콘텐츠 row 클릭
 *   - 토너먼트 결과의 우승지 (deep-link 도입 시)
 *
 * 데이터:
 *   - `useDestinationDetail(id)` → GET /destinations/:id
 *   - mock 은 destinationSeeds + regionContentSeeds 둘 다 탐색
 *
 * generateMetadata:
 *   - title 은 seed 에서 찾아 동적 (없으면 fallback)
 *   - openGraph.images 는 `/api/og/destination?id=...` 동적 카드
 *   - 카톡 / 슬랙 / 트위터 미리보기 시 그 destination 정보가 카드로 노출
 *
 * SubHeader title 은 fetched detail.name 으로 동적 결정해야 하므로 client 가
 * 통째로 담당 (server 가 빈 SubHeader 를 먼저 그리면 client SubHeader 와 두 번
 * 겹쳐 보임).
 */
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seed = destinationSeeds.find((d) => d.id === id);
  const rc = !seed ? regionContentSeeds.find((r) => r.id === id) : null;
  const name = seed?.name ?? rc?.title ?? '여행지';
  const regionCode = seed?.region ?? rc?.region;
  const region = CHUNGBUK_REGIONS.find((r) => r.code === regionCode)?.ko;
  const description = region ? `${region} · ${name} 정보` : `${name} 정보`;

  const ogImage = `/api/og/destination?id=${encodeURIComponent(id)}`;

  return {
    title: name,
    description,
    alternates: {
      canonical: `/destination/${id}`,
    },
    openGraph: {
      title: name,
      description,
      url: `/destination/${id}`,
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

const CATEGORY_TO_TYPE: Record<string, string> = {
  attraction: 'TouristAttraction',
  festival: 'Festival',
  experience: 'TouristAttraction',
  local: 'Place',
};

export default async function DestinationDetailPage({ params }: Props) {
  const { id } = await params;
  const seed = destinationSeeds.find((d) => d.id === id);
  const rc = !seed ? regionContentSeeds.find((r) => r.id === id) : null;
  const name = seed?.name ?? rc?.title ?? '여행지';
  const regionCode = seed?.region ?? rc?.region;
  const region = CHUNGBUK_REGIONS.find((r) => r.code === regionCode);
  const category = seed?.category ?? 'attraction';
  const type = CATEGORY_TO_TYPE[category] ?? 'TouristAttraction';

  // Event JSON-LD (festival 의 eventStart/eventEnd) 는 SSR 단계에서 BE detail fetch
  // 의존이라 운영 ISR generate 시 다양한 회귀 발생 가능 (network / cookie / timeout).
  // schema 보강은 client side hydration 후 DestinationDetailClient 가 detail 받고
  // 처리하는 게 안정적 — SEO crawler 가 schema 못 볼 위험은 있으나, BE 측 generate
  // 안정화 시점에 재도입. seed-only schema 만으로 첫 paint 안전.
  const tNav = await getTranslations('nav');
  const tRegion = await getTranslations('region');

  return (
    <>
      <JsonLd
        data={touristAttraction({
          name,
          type,
          addressLocality: region?.ko,
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: tNav('home'), url: '/' },
          { name: tRegion('title'), url: '/region' },
          ...(region
            ? [{ name: region.ko, url: `/region/${region.code}` }]
            : []),
          { name, url: `/destination/${id}` },
        ])}
      />
      <DestinationDetailClient id={id} />
    </>
  );
}
