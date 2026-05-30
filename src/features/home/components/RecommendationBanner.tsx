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
  id: string;
  emoji: string;
  headline: string;
  destination: string;
  description: string;
  tone: Tone;
  href: '/tournament' | `/region/${string}` | '/letter/compose';
}

const RECOMMENDATIONS: readonly Recommendation[] = [
  {
    id: 'r-1',
    emoji: '🌤️',
    headline: '맑은 날 산책',
    destination: '청남대 호반길',
    description: '호반의 산책로에서 가을 햇살을',
    tone: 'autumn',
    href: '/region/cheongju',
  },
  {
    id: 'r-2',
    emoji: '🍂',
    headline: '이번 주 풍경',
    destination: '단양 도담삼봉',
    description: '단풍이 물든 강변 절경',
    tone: 'autumn',
    href: '/region/danyang',
  },
  {
    id: 'r-3',
    emoji: '🎪',
    headline: '지금 열리는 축제',
    destination: '보은 대추축제',
    description: '가을의 단맛, 지역의 정',
    tone: 'festival',
    href: '/tournament',
  },
] as const;

export function RecommendationBanner() {
  // DEBUG: width 누수 격리 — 캐러셀 자체를 빈 색 div 로 교체. 이 상태에서도
  // 메인 width 가 이상하면 원인은 캐러셀 외부. 정상이면 캐러셀이 원인.
  return (
    <div
      style={{
        height: 220,
        background: '#fde6c2',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8a5a00',
        fontWeight: 700,
      }}
    >
      [DEBUG] Recommendation 영역
    </div>
  );
}

function Slide({ item, ctaLabel }: { item: Recommendation; ctaLabel: string }) {
  return (
    <Link
      href={item.href}
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
