import { getTranslations } from 'next-intl/server';
import { RecommendationBanner } from '@/features/home/components/RecommendationBanner';
import { HomeCategoryPicks } from '@/features/home/components/HomeCategoryPicks';
import { HomeQuickActions } from './HomeQuickActions';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 대시보드 (사이트맵 v2) — Server Component.
 *
 * 위젯 (위 → 아래):
 *   1) 오늘의 추천 (RecommendationBanner — `/v1/rankings?type=recommended&limit=5`)
 *   2) 카테고리별 추천 (HomeCategoryPicks — 칩 필터 + 추천/축제 병합)
 *   3) 빠른 시작 2버튼 (계절 토너먼트 / 유형 테스트) — HomeQuickActions client island
 *
 * 성능 원칙:
 *   - Dashboard shell 은 RSC — 첫 HTML 에 섹션 타이틀 / 정적 layout 즉시 paint
 *   - 데이터 위젯 (RecommendationBanner / HomeCategoryPicks) 은 자체 'use client'
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

      {/* 2) 카테고리 추천 — Figma `rec-block`: 헤더 + 칩 4개 + 카드 가로 스크롤.
             축제(D-day) 도 이 섹션의 "축제" 칩으로 흡수됐다. 빈 응답 시 미노출 */}
      <HomeCategoryPicks />

      {/* 3) 빠른 시작 — season 결정은 client (hydration mismatch 회피) */}
      <HomeQuickActions />
    </div>
  );
}
