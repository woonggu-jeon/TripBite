import { getTranslations } from 'next-intl/server';
import { RecommendationBanner } from '@/features/home/components/RecommendationBanner';
import { FestivalCarousel } from '@/features/home/components/FestivalCarousel';
import { HomeQuickActions } from './HomeQuickActions';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 대시보드 (사이트맵 v2) — Server Component.
 *
 * 위젯 (위 → 아래):
 *   1) 오늘의 추천 (RecommendationBanner — `/v1/rankings?type=recommended&limit=5`)
 *   2) 진행 중인 충북 축제 슬라이드 (Carousel + useOngoingFestivals)
 *   3) 빠른 시작 2버튼 (계절 토너먼트 / 유형 테스트) — HomeQuickActions client island
 *
 * 성능 원칙:
 *   - Dashboard shell 은 RSC — 첫 HTML 에 섹션 타이틀 / 정적 layout 즉시 paint
 *   - 데이터 위젯 (RecommendationBanner / FestivalCarousel) 은 자체 'use client'
 *     + useQuery → streaming 으로 채워짐
 *   - QuickActions 만 season-aware client island — getCurrentSeason 의 시간대 의존성
 *     격리. shell 의 server render 와 mismatch 없도록 useEffect 안에서 결정.
 *
 * 4) 새로 도착한 편지 미리보기 / 5) 내 우승지 가로 슬라이드 — 사용자 요청으로 미노출.
 * 추후 재오픈 시 LatestReceivedLetter / SavedTournaments carousel 복원.
 */
export async function HomeDashboard() {
  const t = await getTranslations('home.widgets');

  return (
    <div className={styles.grid}>
      {/* 1) 오늘의 추천 — Figma `hero-block` 에는 섹션 제목이 없다 (hero 안의
             eyebrow "오늘의 추천" 이 그 역할). aria-label 로만 라벨 유지. */}
      <section
        data-widget="weather-recommendation"
        aria-label={t('weatherRecommendation')}
      >
        <RecommendationBanner />
      </section>

      {/* 2) 지금 열리는 충북 축제 — 빈 응답 시 자체 미노출 */}
      <FestivalCarousel />

      {/* 3) 빠른 시작 — season 결정은 client (hydration mismatch 회피) */}
      <HomeQuickActions />
    </div>
  );
}
