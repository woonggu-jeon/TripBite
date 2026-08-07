'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { useRegionSummary } from '@/features/region/hooks/use-region';
import styles from './RegionHero.module.scss';

/**
 * <RegionHero />
 *
 * 시군 상세 페이지 (/region/[code]) 의 상단 hero.
 *
 * Figma `RGN · 시군상세` 의 `banner` 실측 (320x103):
 *   - 단색 면 #EAF6EF (= --color-primary-soft), radius 12, 1px #E0E0E0 보더
 *   - VERTICAL gap 12, padding 16
 *   - 시군명 Title/B_20_130% #151515
 *     → 영문명 Caption/B_10 #00B334   (gap 4 로 묶인 한 그룹)
 *   - 설명 Caption/R_12 #393939
 *
 * ⚠ 시안에 사진/썸네일이 없다 — 홈·랭킹 1위와 달리 이 배너는 사진 배경이
 *   아니다. 기존의 원형 heroImage 썸네일(장식, aria-hidden)은 시안에 없어 제거.
 *   시군 사진은 하단 DestinationCard 들이 담당.
 *   인기도 chip 도 시안에 없지만 API 실데이터의 유일한 노출 지점이라 유지.
 *
 * 데이터: `useRegionSummary(code)` → GET /regions/:code/summary.
 * 실패 시 시군명 + fallback 설명만 (graceful degradation).
 */
export function RegionHero({ code }: { code: RegionCode }) {
  const t = useTranslations('region.hero');
  const tNames = useTranslations('region.names');
  const { data, isLoading } = useRegionSummary(code);

  const meta = CHUNGBUK_REGIONS.find((r) => r.code === code);
  const name = tNames(code as Parameters<typeof tNames>[0]);

  if (isLoading) {
    // Figma banner 103px → 4px 그리드로 104
    return <Skeleton width="100%" height={104} radius="md" />;
  }

  const description = data?.description ?? t('fallbackDescription', { name });
  const popularity = data?.popularity;

  return (
    <section className={styles.wrap} aria-label={name}>
      <div className={styles.titleGroup}>
        {/* SubHeader 가 페이지 h1 — Hero 는 h2 로 위계 보존 */}
        <h2 className={styles.title}>{name}</h2>
        <p className={styles.subtitle}>{meta?.en ?? code}</p>
      </div>
      <p className={styles.description}>{description}</p>
      {typeof popularity === 'number' && (
        <div className={styles.popularity}>
          <TrendingUp size={14} aria-hidden />
          <span>
            {t('popularity')} {popularity}
          </span>
        </div>
      )}
    </section>
  );
}
