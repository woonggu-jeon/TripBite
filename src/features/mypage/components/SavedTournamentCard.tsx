'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { SavedTournament } from '@/features/tournament/types';
import styles from './SavedTournamentCard.module.scss';

const CATEGORY_EMOJI: Record<string, string> = {
  local: '🏘️',
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
};

/**
 * 저장된 토너먼트 우승 여행지 카드 — Link 단일. 삭제는 상세 페이지에서 처리.
 *
 * layout:
 *   - 'tile' (default) : 세로 카드 — 상단 emoji 영역 + 하단 이름/지역. mypage 3 col grid 용
 *   - 'row'            : 가로 카드 — 좌 emoji + 우 이름/지역. /saved-tournaments 리스트 용
 */
export function SavedTournamentCard({
  saved,
  layout = 'tile',
}: {
  saved: SavedTournament;
  layout?: 'tile' | 'row';
}) {
  const region = CHUNGBUK_REGIONS.find(
    (r) => r.code === saved.destination.region,
  );
  const regionLabel = region?.ko ?? saved.destination.region;
  const emoji = CATEGORY_EMOJI[saved.destination.category] ?? '🏆';

  return (
    <Card variant="surface" padding="none" className={styles.card}>
      <Link
        href={{ pathname: `/destination/${saved.destination.id}` }}
        prefetch={false}
        className={layout === 'row' ? styles.linkRow : styles.link}
        aria-label={`${saved.destination.name} 상세`}
      >
        <div className={styles.image} aria-hidden>
          <span
            className={styles.colorChip}
            style={{ background: saved.luckyColor }}
          />
          <span className={styles.emoji}>{emoji}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.name}>{saved.destination.name}</h3>
          <p className={styles.meta}>{regionLabel}</p>
        </div>
      </Link>
    </Card>
  );
}
