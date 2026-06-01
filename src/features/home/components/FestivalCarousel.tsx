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
  /** destinationSeeds 와 매칭되는 id — 클릭 시 /destination/{id} 로 진입. */
  id: string;
  name: string;
  region: string;
  period: string;
  emoji: string;
  tone: 'red' | 'amber' | 'green' | 'blue' | 'violet';
}

// id 는 mocks/seeds/destinations.ts 의 destinationSeeds id 와 일치
// (보은 대추축제 = boeun-festival-1 등) — /api/destinations/:id mock 응답 정상.
const FESTIVALS: readonly Festival[] = [
  {
    id: 'boeun-festival-1',
    name: '보은 대추축제',
    region: '보은군',
    period: '10.10 — 10.16',
    emoji: '🌰',
    tone: 'amber',
  },
  {
    id: 'danyang-festival-1',
    name: '단양 마늘축제',
    region: '단양군',
    period: '10.05 — 10.08',
    emoji: '🧄',
    tone: 'green',
  },
  {
    id: 'goesan-festival-1',
    name: '괴산 고추축제',
    region: '괴산군',
    period: '08.30 — 09.03',
    emoji: '🌶️',
    tone: 'red',
  },
  {
    id: 'cheongju-festival-1',
    name: '청주 공예비엔날레',
    region: '청주시',
    period: '09.01 — 10.15',
    emoji: '🎨',
    tone: 'violet',
  },
  {
    id: 'jecheon-festival-1',
    name: '제천 국제음악영화제',
    region: '제천시',
    period: '08.10 — 08.15',
    emoji: '🎬',
    tone: 'blue',
  },
] as const;

/**
 * 화면 너비별 slidesPerView — 작은 화면 카드 잘림 방지.
 *   ≤ 360px : 1.8 (한 장 + 다음 카드 미리보기)
 *   ≤ 480px : 2.2 (iPhone 일반 / 갤럭시 S 시리즈)
 *   그 외   : 3 (태블릿 / 데스크탑)
 *
 * 핵심 — useState lazy initializer 로 mount 직전 window.innerWidth 를 동기
 * 측정해 첫 render 부터 정확한 값 사용. mount 후 useEffect 가 별도로 setV
 * 호출하면 inline flex calc 값이 바뀌면서 카드 폭 점프 → iOS Safari 에서
 * 떨림으로 보임. lazy init 으로 첫 render = mount 후 render 동일하게 만들면
 * 떨림 발생 단계 자체가 사라짐.
 *
 * SSR 안전: 이 hook 사용처(CarouselImpl)가 'use client' + clientOnly dynamic
 * (ssr:false) 라 server 에선 안 그려짐. typeof window 분기는 안전망.
 */
function pickSlidesPerView(w: number) {
  return w <= 360 ? 1.8 : w <= 480 ? 2.2 : 3;
}

function useResponsiveSlidesPerView() {
  const [v, setV] = useState(() =>
    typeof window === 'undefined' ? 2.2 : pickSlidesPerView(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => {
      const next = pickSlidesPerView(window.innerWidth);
      setV((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
      // dynamic import 동안 자리잡이 — 실제 카드 height (image aspect 1.5/1
      // + body + padding) 에 맞춤. 모바일 ≤480 기준 약 200px (image 128 +
      // body 50 + padding 16 + 여유). 데스크탑은 더 크지만 mount 시 늘어나는
      // 방향이라 layout shift 만 줄어듦.
      fallbackHeight={200}
      ariaLabel={t('label')}
    />
  );
}

function Card({ festival }: { festival: Festival }) {
  return (
    <Link
      href={{ pathname: `/destination/${festival.id}` }}
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
