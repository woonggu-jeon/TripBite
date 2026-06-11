'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Carousel } from '@/features/carousel';
import { Skeleton } from '@/components/feedback/Skeleton';
import { MediaThumb } from '@/components/ui';
import { useRecommendedDestinations } from '@/features/ranking/hooks/use-ranking';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji } from '@/constants/emoji-map';
import type { Destination } from '@/features/tournament/types';
import styles from './RecommendationBanner.module.scss';

/**
 * 오늘의 추천 — `/v1/rankings?type=recommended&limit=5` 응답.
 *
 * BE 가 카테고리/지역/계절 가중치 산정 → top 5 destinations. FE 는 그대로 표시.
 * 빈 응답 / 에러 → 영역 미노출 (HomeDashboard 가 children render 결정 위해
 * 부모 wrapper 없이 통째 자체 책임).
 */
type Tone = 'spring' | 'summer' | 'autumn' | 'winter' | 'festival';

function toneForCategory(category: Destination['category']): Tone {
  // category → 시즌/festival 톤 매핑 (디자인 일관 유지).
  if (category === 'festival') return 'festival';
  if (category === 'experience') return 'spring';
  if (category === 'local') return 'autumn';
  return 'summer';
}

function regionLabelFor(code: string): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

export function RecommendationBanner() {
  const t = useTranslations('home.recommendation');
  const { data, isLoading, isError } = useRecommendedDestinations(5);

  if (isLoading) {
    return <Skeleton width="100%" height={248} radius="lg" />;
  }

  if (isError || !data || data.length === 0) {
    return null;
  }

  const items = data.map((r) => r.destination);

  return (
    <div className={styles.wrap}>
      <Carousel
        slides={items}
        renderSlide={(item) => <Slide item={item} ctaLabel={t('cta')} />}
        keyExtractor={(item) => item.id}
        options={{ loop: true, autoplayMs: 4500 }}
        showDots
        fallbackHeight={200}
        ariaLabel={t('label')}
      />
    </div>
  );
}

function Slide({ item, ctaLabel }: { item: Destination; ctaLabel: string }) {
  const tone = toneForCategory(item.category);
  const regionKo = regionLabelFor(item.region);
  return (
    <Link
      href={{ pathname: `/destination/${item.id}` }}
      className={`${styles.slide} ${styles[tone]}`}
      aria-label={`${item.name} · ${regionKo}`}
    >
      <MediaThumb
        src={item.imageUrl}
        emoji={categoryEmoji(item.category, '✨')}
        sizes="(max-width: 480px) 72px, 96px"
        className={styles.media}
        emojiClassName={styles.emoji}
      />
      <div className={styles.body}>
        <p className={styles.headline}>{regionKo}</p>
        <h3 className={styles.destination}>{item.name}</h3>
        <span className={styles.cta}>
          {ctaLabel}
          <ArrowRight size={14} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
