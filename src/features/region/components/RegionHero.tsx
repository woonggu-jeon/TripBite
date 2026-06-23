'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { useRegionSummary } from '@/features/region/hooks/use-region';
import styles from './RegionHero.module.scss';

/**
 * <RegionHero /> — Figma "RGN · 시군상세 banner" (2026-06-23) 정합.
 *
 * 시군 상세 페이지 (/region/[code]) 의 상단 banner.
 *   - secondary01 bg + 1px gray border + radius 12, padding 16 20 column gap 12.
 *   - Frame 30 (column gap 4): title B_20_130% fg "단양" + eyebrow Caption
 *     B_10 primary "DANYANG".
 *   - subtitle Caption R_12 muted (서버 description 또는 fallback).
 *
 * 데이터: `useRegionSummary(code)` → GET /regions/:code/summary.
 * popularity 는 Figma 미명시 — 제거 (현재 banner 시각 단순).
 */
export function RegionHero({ code }: { code: RegionCode }) {
  const t = useTranslations('region.hero');
  const tNames = useTranslations('region.names');
  const { data, isLoading } = useRegionSummary(code);

  const meta = CHUNGBUK_REGIONS.find((r) => r.code === code);
  const name = tNames(code as Parameters<typeof tNames>[0]);
  const eyebrow = (meta?.en ?? code).toUpperCase();

  if (isLoading && !data) {
    // Figma layout 대응 skeleton — banner 박스 (320×103) 유지 + 자식 placeholder.
    return (
      <section className={styles.banner} aria-label={name} aria-busy>
        <div className={styles.head}>
          <Skeleton width="40%" height={26} radius="sm" />
          <Skeleton width="30%" height={12} radius="sm" />
        </div>
        <Skeleton width="100%" height={17} radius="sm" />
      </section>
    );
  }

  const description = data?.description ?? t('fallbackDescription', { name });

  return (
    <section className={styles.banner} aria-label={name}>
      <div className={styles.head}>
        <h2 className={styles.title}>{name}</h2>
        <span className={styles.eyebrow}>{eyebrow}</span>
      </div>
      <p className={styles.description}>{description}</p>
    </section>
  );
}
