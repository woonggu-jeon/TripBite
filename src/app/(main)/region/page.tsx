import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { RegionMapClient } from './_components/RegionMapClient';

// 시군 정보는 안정 — 1h ISR. URL prefix i18n 으로 cookies() 의존 제거 → 호환.
export const revalidate = 3600;

/**
 * 충북 11개 시군 지도 페이지 (/region)
 *
 * 구성:
 *   - SubHeader: 뒤로가기 + "시군 둘러보기"
 *   - 본문: 충북 SVG 지도 + 11개 시군 영역 클릭 가능
 *           각 시군 클릭 시 /region/[code] 로 이동
 *   - 보조: 시군 리스트 (스크롤 가능) — 지도가 작은 화면에서 백업
 *
 * 성능:
 *   - SVG 지도는 인라인 (별도 fetch 없음, 캐시 영구)
 *   - 시군 메타데이터는 @/constants/regions 에서 정적 import (번들 0KB 추가)
 *   - 인기/방문 수 같은 동적 데이터는 client에서 useQuery (CACHE.normal)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('region');
  return { title: t('title') };
}

export default async function RegionPage() {
  const t = await getTranslations('region');
  return (
    <>
      <SubHeader title={t('title')} />
      <RegionMapClient />
    </>
  );
}
