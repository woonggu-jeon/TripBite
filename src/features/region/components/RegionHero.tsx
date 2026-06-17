'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { MediaThumb } from '@/components/ui';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import { useRegionSummary } from '@/features/region/hooks/use-region';
import styles from './RegionHero.module.scss';

const REGION_EMOJI: Record<RegionCode, string> = {
  cheongju: '🏛️',
  chungju: '🍎',
  jecheon: '🏞️',
  boeun: '🌰',
  okcheon: '🌿',
  yeongdong: '🍇',
  jincheon: '🌾',
  goesan: '🌶️',
  eumseong: '🎭',
  danyang: '⛰️',
  jeungpyeong: '🌱',
};

/**
 * <RegionHero />
 *
 * 시군 상세 페이지 (/region/[code]) 의 상단 hero.
 *
 * 표시:
 *   - heroImage (TourAPI) 있으면 노출, 없으면 emoji fallback
 *   - 시군명 (ko)
 *   - 설명 (서버 응답 or fallback)
 *   - 인기도 chip (popularity 값 0-100)
 *
 * 데이터: `useRegionSummary(code)` → GET /regions/:code/summary.
 * 로딩 시 Skeleton, 실패 시 emoji + 시군명만 (graceful degradation).
 *
 * heroImage 의 http→https 정규화는 regionApi.getSummary 가 처리.
 */
export function RegionHero({ code }: { code: RegionCode }) {
  const t = useTranslations('region.hero');
  const tNames = useTranslations('region.names');
  const { data, isLoading } = useRegionSummary(code);

  const meta = CHUNGBUK_REGIONS.find((r) => r.code === code);
  const name = tNames(code as Parameters<typeof tNames>[0]);
  const emoji = REGION_EMOJI[code];

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={140} radius="lg" />
      </div>
    );
  }

  const description = data?.description ?? t('fallbackDescription', { name });
  const popularity = data?.popularity;
  const heroImage = data?.heroImage;

  return (
    <section className={styles.wrap} aria-label={name}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.content}>
        <div className={styles.thumbWrap} aria-hidden>
          <MediaThumb
            src={heroImage}
            emoji={emoji}
            sizes="64px"
            className={styles.thumb}
            emojiClassName={styles.emoji}
          />
        </div>
        <div className={styles.body}>
          {/* SubHeader 가 페이지 h1 — Hero 는 h2 로 위계 보존 */}
          <h2 className={styles.title}>{name}</h2>
          <p className={styles.subtitle}>{meta?.en ?? code}</p>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
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
