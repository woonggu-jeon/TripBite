'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Trophy, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { RecommendationBanner } from '@/features/home/components/RecommendationBanner';
// 날씨 위젯만 미노출 (사용자 요청). "오늘의 추천" 섹션 + RecommendationBanner 는 유지.
import { FestivalCarousel } from '@/features/home/components/FestivalCarousel';
// LatestReceivedLetter 위젯 미노출 — 추후 재오픈 시 import 복원.
// import { LatestReceivedLetter } from '@/features/home/components/LatestReceivedLetter';
import { getCurrentSeason } from '@/features/tournament/utils/season';
import type { Season } from '@/features/tournament/types';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 대시보드 (사이트맵 v2)
 *
 * 위젯 (위 → 아래):
 *   1) 오늘의 추천 (RecommendationBanner — `/v1/rankings?type=recommended&limit=5`)
 *   2) 진행 중인 충북 축제 슬라이드 (Carousel + useOngoingFestivals)
 *   3) 빠른 시작 2버튼 (계절 토너먼트 / 유형 테스트)
 *      - 토너먼트: 현재 월 → 계절 자동 → 라벨 동적, 클릭 시 theme=season +
 *        season=현재계절 query 로 setup 의 step 3 (여행 유형) 부터 시작.
 *      - 편지 쓰기는 홈에서 미노출 (편지 메뉴 / 알림함 경로로 진입).
 *   4) 새로 도착한 편지 미리보기 (가장 최근 1장 + 도트)
 *   5) 내 우승지 가로 슬라이드 (Carousel + slidesPerView 2~3)
 *
 * 성능 원칙:
 *   - 각 위젯은 자체 useQuery → waterfall 회피
 *   - 무거운 모듈(Carousel, Chart)은 동적 import (이미 features/* 에서 처리)
 *   - 위젯 단위 fixed height → CLS 0
 *   - 첫 페인트 후 위젯들이 streaming 으로 채워짐
 */
export function HomeDashboard() {
  const t = useTranslations('home.widgets');

  // 첫 SSR/hydration 에서 hydration mismatch 회피 — mount 후 클라이언트 시간으로
  // 계절 결정. 잠깐의 fallback("spring") 은 시각상 거의 인지 불가.
  const [season, setSeason] = useState<Season>('spring');
  useEffect(() => {
    setSeason(getCurrentSeason());
  }, []);

  return (
    <div className={styles.grid}>
      {/* 1) 오늘의 추천 — RecommendationBanner 만 노출 (날씨 위젯은 사용자 요청으로 미노출). */}
      <section
        data-widget="weather-recommendation"
        aria-label={t('weatherRecommendation')}
      >
        <h2 className={styles.sectionTitle}>{t('weatherRecommendation')}</h2>
        <RecommendationBanner />
      </section>

      {/* 2) 지금 열리는 충북 축제 — 빈 응답 시 자체 미노출 (FestivalCarousel 안에서 section+h2 책임) */}
      <FestivalCarousel />

      {/* 3) 빠른 시작 2버튼 — 계절 토너먼트 / 유형 테스트 */}
      <section data-widget="quick-actions" className={styles.quickActions}>
        <QuickActionLink
          href={{
            pathname: ROUTES.TOURNAMENT,
            query: { theme: 'season', season },
          }}
          icon={<Trophy size={20} />}
          label={t(`quick.tournamentBySeason.${season}`)}
        />
        <QuickActionLink
          href={ROUTES.QUIZ}
          icon={<Sparkles size={20} />}
          label={t('quick.quiz')}
        />
      </section>

      {/*
        4) 새로 도착한 편지 미리보기 — 미노출 (사용자 요청).
        5) 내 우승지 가로 슬라이드 — 미노출 (사용자 요청).
        둘 다 추후 재오픈 시 아래 코드 블록 복원:

        <section data-widget="latest-letter" aria-label={t('latestLetter')}>
          <h2 className={styles.sectionTitle}>{t('latestLetter')}</h2>
          <LatestReceivedLetter />
        </section>

        <section data-widget="my-winners">
          <Placeholder height={140} title={t('myWinners')} note="Carousel" />
          // TODO: useSavedTournaments → Carousel + WinnerMiniCard
        </section>
      */}
    </div>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
}: {
  // typedRoutes 호환 — ROUTES.* 리터럴 또는 next/link Route 타입
  href: React.ComponentProps<typeof Link>['href'];
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className={styles.quickAction}>
      <span className={styles.quickActionIcon}>{icon}</span>
      <span className={styles.quickActionLabel}>{label}</span>
    </Link>
  );
}

// latestLetter / myWinners 위젯 재오픈 시 Placeholder 컴포넌트 복원:
//   function Placeholder({ height, title, note }) {
//     return (
//       <div className={styles.placeholder} style={{ height }}>
//         {title}{note && <span className={styles.placeholderNote}>{note}</span>}
//       </div>
//     );
//   }
