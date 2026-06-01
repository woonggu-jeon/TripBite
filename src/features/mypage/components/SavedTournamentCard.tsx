'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Card, IconButton } from '@/components/ui';
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
 * 저장된 토너먼트 우승 여행지 카드.
 *
 * 카드 본체는 `Link` 로 destination 상세 진입. 우상단 삭제 (X) button 만
 * 별도 — Link 안의 button 은 nested interactive 라 stopPropagation 으로
 * Link 이동 차단.
 */
export function SavedTournamentCard({
  saved,
  onRemove,
}: {
  saved: SavedTournament;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations('mypage.savedTournaments');
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
        className={styles.link}
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
      <IconButton
        aria-label={t('remove')}
        variant="ghost"
        size="sm"
        className={styles.remove}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(saved.id);
        }}
      >
        <X size={16} aria-hidden />
      </IconButton>
    </Card>
  );
}
