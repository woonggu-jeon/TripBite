'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Carousel } from '@/features/carousel';
import styles from './RecommendationBanner.module.scss';

/**
 * 오늘의 추천 — 빌보드 형식 hero 배너.
 *
 * 풀폭 큰 카드 N장을 autoplay + dots 로 순환.
 * 좌측 큰 이모지 + 우측 헤드라인/부제/CTA, 톤별 그라데이션 배경.
 *
 * 데이터:
 *   - 현재는 mock (날씨/위치/계절 기반 추천 알고리즘은 추후 백엔드)
 *   - 추후 useRecommendations() hook 으로 교체 가능
 */

type Tone = 'spring' | 'summer' | 'autumn' | 'winter' | 'festival';

interface Recommendation {
  /** 카드 식별자 (key 용) */
  id: string;
  /** destinationSeeds 와 매칭되는 id — 클릭 시 /destination/{id} 로 진입. */
  destinationId: string;
  emoji: string;
  headline: string;
  destination: string;
  description: string;
  tone: Tone;
}

// destinationId 는 mocks/seeds/destinations.ts 와 매칭.
const RECOMMENDATIONS: readonly Recommendation[] = [
  {
    id: 'r-1',
    destinationId: 'cheongju-attraction-1', // 청남대
    emoji: '🌤️',
    headline: '맑은 날 산책',
    destination: '청남대',
    description: '호반의 산책로에서 가을 햇살을',
    tone: 'autumn',
  },
  {
    id: 'r-2',
    destinationId: 'danyang-attraction-1', // 도담삼봉
    emoji: '🍂',
    headline: '이번 주 풍경',
    destination: '단양 도담삼봉',
    description: '단풍이 물든 강변 절경',
    tone: 'autumn',
  },
  {
    id: 'r-3',
    destinationId: 'boeun-festival-1', // 보은대추축제
    emoji: '🎪',
    headline: '지금 열리는 축제',
    destination: '보은 대추축제',
    description: '가을의 단맛, 지역의 정',
    tone: 'festival',
  },
] as const;

export function RecommendationBanner() {
  const t = useTranslations('home.recommendation');

  return (
    <Carousel
      slides={[...RECOMMENDATIONS]}
      renderSlide={(item) => <Slide item={item} ctaLabel={t('cta')} />}
      keyExtractor={(item) => item.id}
      options={{ loop: true, autoplayMs: 4500 }}
      showDots
      // dynamic import 동안 자리잡이 — CLS 방지 (slide height 220 + dots 약 28)
      fallbackHeight={248}
      ariaLabel={t('label')}
    />
  );
}

function Slide({ item, ctaLabel }: { item: Recommendation; ctaLabel: string }) {
  return (
    <Link
      href={{ pathname: `/destination/${item.destinationId}` }}
      className={`${styles.slide} ${styles[item.tone]}`}
      aria-label={`${item.headline} ${item.destination}`}
    >
      <div className={styles.emoji} aria-hidden>
        {item.emoji}
      </div>
      <div className={styles.body}>
        <p className={styles.headline}>{item.headline}</p>
        <h3 className={styles.destination}>{item.destination}</h3>
        <p className={styles.description}>{item.description}</p>
        <span className={styles.cta}>
          {ctaLabel}
          <ArrowRight size={14} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
