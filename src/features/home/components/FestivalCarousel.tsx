'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Carousel } from '@/features/carousel';
import styles from './FestivalCarousel.module.scss';

/**
 * 지금 열리는 충북 축제 — 카드형 가로 스와이퍼.
 *
 * slidesPerView 1.2 + dragFree — 한 화면에 1장 + 다음 카드 살짝 보이는 모바일 패턴.
 * 카드: 큰 이모지 + 제목 + 시군·기간.
 *
 * 데이터:
 *   - 현재는 mock. 추후 useOngoingFestivals() hook 으로 교체.
 */

interface Festival {
  id: string;
  name: string;
  region: string;
  period: string;
  emoji: string;
  tone: 'red' | 'amber' | 'green' | 'blue' | 'violet';
  href: `/region/${string}`;
}

const FESTIVALS: readonly Festival[] = [
  {
    id: 'f-1',
    name: '보은 대추축제',
    region: '보은군',
    period: '10.10 — 10.16',
    emoji: '🌰',
    tone: 'amber',
    href: '/region/boeun',
  },
  {
    id: 'f-2',
    name: '단양 마늘축제',
    region: '단양군',
    period: '10.05 — 10.08',
    emoji: '🧄',
    tone: 'green',
    href: '/region/danyang',
  },
  {
    id: 'f-3',
    name: '괴산 고추축제',
    region: '괴산군',
    period: '08.30 — 09.03',
    emoji: '🌶️',
    tone: 'red',
    href: '/region/goesan',
  },
  {
    id: 'f-4',
    name: '청주 공예비엔날레',
    region: '청주시',
    period: '09.01 — 10.15',
    emoji: '🎨',
    tone: 'violet',
    href: '/region/cheongju',
  },
  {
    id: 'f-5',
    name: '제천 국제음악영화제',
    region: '제천시',
    period: '08.10 — 08.15',
    emoji: '🎬',
    tone: 'blue',
    href: '/region/jecheon',
  },
] as const;

/**
 * 화면 너비별 slidesPerView — 작은 화면 카드 잘림 방지.
 *   ≤ 360px : 1.8 (한 장 + 다음 카드 미리보기)
 *   ≤ 480px : 2.2
 *   그 외   : 3
 *
 * embla 의 slidesPerView 옵션은 컴포넌트 mount 시 적용되므로 useEffect 로
 * resize 추적 + reInit. 잦은 리사이즈는 SSR/모바일 회전에서만 일어남.
 */
function useResponsiveSlidesPerView() {
  const [v, setV] = useState(3);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setV(w <= 360 ? 1.8 : w <= 480 ? 2.2 : 3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return v;
}

export function FestivalCarousel() {
  const t = useTranslations('home.festivals');
  const slidesPerView = useResponsiveSlidesPerView();

  return (
    <Carousel
      // key 로 강제 remount — slidesPerView 변경 시 embla 재초기화 (옵션은 mount 시점에만 적용)
      key={slidesPerView}
      slides={[...FESTIVALS]}
      renderSlide={(f) => <Card festival={f} />}
      keyExtractor={(f) => f.id}
      options={{ slidesPerView, gap: 8 }}
      showDots={false}
      // dynamic import 동안 자리잡이 — CLS 방지
      fallbackHeight={180}
      ariaLabel={t('label')}
    />
  );
}

function Card({ festival }: { festival: Festival }) {
  return (
    <Link
      href={festival.href}
      className={`${styles.card} ${styles[festival.tone]}`}
      aria-label={`${festival.name} ${festival.period}`}
    >
      <div className={styles.image} aria-hidden>
        <span className={styles.emoji}>{festival.emoji}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.region}>{festival.region}</p>
        <h3 className={styles.name}>{festival.name}</h3>
        <p className={styles.period}>{festival.period}</p>
      </div>
    </Link>
  );
}
