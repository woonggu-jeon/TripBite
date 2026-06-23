import { getTranslations } from 'next-intl/server';
import { HomeHero } from '@/features/home/components/HomeHero';
import { HomeRecBlock } from '@/features/home/components/HomeRecBlock';
import { HomeQuickActions } from './HomeQuickActions';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 대시보드 — Figma "HOME · 홈" (2026-06-23) 정합.
 *
 * 위젯 (위 → 아래):
 *   1) HomeHero — 단일 큰 카드 (image + 90deg dark overlay + 텍스트).
 *      useRecommendedDestinations(5) → [0] 만 사용.
 *   2) HomeRecBlock — chip filter (전체/축제/관광지/체험) + DestinationCard 3
 *      horizontal scroll. 같은 hook 의 [1..] 노출 (TanStack Query cache 공유).
 *   3) HomeQuickActions — 2 banner (primary-soft + amber-soft). season-aware.
 *
 * 이전 RecommendationBanner / FestivalCarousel 폐기 — Figma spec 의 hero +
 * rec-block 구조로 통합 (rec-block 의 카테고리 chip 으로 축제/관광지/체험
 * 모두 한 영역).
 */
export async function HomeDashboard() {
  const t = await getTranslations('home');
  return (
    <div className={styles.grid}>
      {/* a11y h1 — SubHeader 미사용 페이지 (AppHeader 만) sr-only h1 으로 페이지
          제목. 시각 영향 0, screen reader 가 페이지 구조 인식. */}
      <h1 className={styles.srOnly}>{t('title')}</h1>
      <HomeHero />
      <HomeRecBlock />
      <HomeQuickActions />
    </div>
  );
}
