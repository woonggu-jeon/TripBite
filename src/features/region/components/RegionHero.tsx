'use client';

import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import styles from './RegionHero.module.scss';

/**
 * <RegionHero />
 *
 * 시군 상세 페이지 (/region/[code]) 의 상단 hero — 시군명 + 영문명 + 설명.
 *
 * Spring 은 `/regions/{code}/summary`(description/popularity/heroImage) 미지원 →
 * FE 정적 콘텐츠로 렌더(전환): 시군명·영문명은 i18n/상수, 설명은 i18n 문구.
 * (인기도 chip 은 Spring 미제공이라 제거. 시군 사진은 하단 DestinationCard 담당.)
 */
export function RegionHero({ code }: { code: RegionCode }) {
  const t = useTranslations('region.hero');
  const tNames = useTranslations('region.names');

  const meta = CHUNGBUK_REGIONS.find((r) => r.code === code);
  const name = tNames(code as Parameters<typeof tNames>[0]);
  const description = t('fallbackDescription', { name });

  return (
    <section className={styles.wrap} aria-label={name}>
      <div className={styles.titleGroup}>
        {/* SubHeader 가 페이지 h1 — Hero 는 h2 로 위계 보존 */}
        <h2 className={styles.title}>{name}</h2>
        <p className={styles.subtitle}>{meta?.en ?? code}</p>
      </div>
      <p className={styles.description}>{description}</p>
    </section>
  );
}
