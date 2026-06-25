'use client';

import type { Season } from '@/api/generated/schemas';
import { SeasonIcon } from '@/components/ui/SeasonIcon';
import styles from './SeasonLoadingPanel.module.scss';

/**
 * 계절 테마 로딩 패널 — TournamentSetup step 5 intro 와 동일 디자인.
 *
 * Figma "TRN · 로딩 (지도 펼침)-{봄/여름/가을/겨울}" 정합. 134 circle-stack
 * (outer 계절색 + 100 white + 64 PNG seasonIcon) + B_20 title + 3-dot
 * indicator. data-season cascade 로 outer circle bg 자동.
 *
 * 사용처:
 *   - TournamentSetup step 5 intro (지도 펼침 직전)
 *   - TournamentPlayClient bracket data fetching ("여행지를 불러오는 중")
 */
export function SeasonLoadingPanel({
  season,
  title,
}: {
  season: Season;
  title: string;
}) {
  return (
    <div
      className={styles.panel}
      data-season={season}
      role="status"
      aria-live="polite"
    >
      <div className={styles.circleStack} aria-hidden>
        <span className={styles.circleAmber} />
        <span className={styles.circleWhite} />
        <SeasonIcon season={season} size={64} className={styles.circleLeaf} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.dots} aria-hidden>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
