'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { ChungbukStampMap } from '@/features/region/components/ChungbukStampMap';
import styles from './RegionMapClient.module.scss';

/**
 * 충북 지도 클라이언트
 *
 * 정밀 SVG 11 시군 (도장책에 쓰는 `ChungbukStampMap` 재사용) + 클릭 시
 * 해당 시군 상세 라우팅. /region 페이지는 도장 진행률 의미가 없으므로
 * visited 는 빈 Set — 모든 시군이 default fill.
 *
 * 보조 그리드는 a11y / fallback 용 — 키보드/스크린리더로 빠른 진입.
 */
export function RegionMapClient() {
  const router = useRouter();
  const tRegion = useTranslations('region.names');

  // referential stability — 매 렌더 새 Set 생성 시 ChungbukStampMap effect 재실행
  const visited = useMemo(() => new Set<RegionCode>(), []);

  return (
    <div className={styles.wrap}>
      <ChungbukStampMap
        visited={visited}
        onRegionClick={(code) => router.push(`/region/${code}`)}
      />

      {/* 보조 그리드 — 키보드/스크린리더 빠른 진입 */}
      <ul className={styles.list}>
        {CHUNGBUK_REGIONS.map((r) => (
          <li key={r.code}>
            <button
              type="button"
              onClick={() => router.push(`/region/${r.code}`)}
              className={styles.item}
            >
              {/* i18n: region.names.<code> 키로 매핑 */}
              {tRegion(r.code as Parameters<typeof tRegion>[0])}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
