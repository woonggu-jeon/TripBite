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
 *   ≤ 480px : 2.2 (iPhone 일반 / 갤럭시 S 시리즈)
 *   그 외   : 3 (태블릿 / 데스크탑)
 *
 * iOS 깜빡임 해결:
 *   - SSR 은 window 없음 → default 를 모바일 우선(2.2) 으로 두면 hydrate 후
 *     모바일에서 동일 값 → re-render 없음, embla remount 없음
 *   - setV 도 같은 값이면 setState skip
 *   - key prop 제거 — slidesPerView 가 거의 안 바뀌므로 강제 remount 불필요
 */
function useResponsiveSlidesPerView() {
  // SSR 안전 default — 모바일 우선 (대부분 사용자가 모바일)
  const [v, setV] = useState(2.2);
  useEffect(() => {
    let lastWidth = -1;
    const update = () => {
      const w = window.innerWidth;
      // iOS Safari 의 toolbar 토글은 innerHeight 만 바꾸고 width 는 보존.
      // 그래도 resize 가 매번 발화하므로, width 가 실제로 달라졌을 때만 처리.
      if (w === lastWidth) return;
      lastWidth = w;
      const next = w <= 360 ? 1.8 : w <= 480 ? 2.2 : 3;
      setV((prev) => (prev === next ? prev : next));
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
