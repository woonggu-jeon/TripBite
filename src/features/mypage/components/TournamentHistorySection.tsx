'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon/Icon';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useTournamentHistory } from '@/features/tournament/hooks/use-tournament';
import styles from './TournamentHistorySection.module.scss';

const CATEGORY_KO: Record<string, string> = {
  local: '지역',
  festival: '축제',
  attraction: '관광지',
  experience: '체험',
};

type HistoryItem = {
  id: string;
  theme: string;
  category: string;
  count: number;
  winnerId: string;
  winnerName?: string;
  completedAt: string;
};

/**
 * 토너먼트 기록 — 사용자가 진행한 토너먼트의 시즌/유형/갯수/완료 시각 row 리스트.
 *
 * useTournamentHistory → GET /mypage/tournament-history.
 * mock 은 단일 페이지 — BE 도입 시 InfiniteList 로 확장.
 */
export function TournamentHistorySection() {
  const t = useTranslations('mypage.tournamentHistory');
  const { data, isLoading, isError, refetch } = useTournamentHistory();

  if (isLoading) {
    return (
      <div className={styles.skeletonList}>
        <SkeletonList count={3} height={56} radius="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Icon name="trophy-large" size={28} />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const items = (data?.items as HistoryItem[] | undefined) ?? [];
  if (items.length === 0) {
    // Figma "MY_01" empty-recent — 320×60 white card border radius 12 + title B_14 center.
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>{t('empty')}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {items.slice(0, 10).map((it) => {
        const categoryLabel = CATEGORY_KO[it.category] ?? it.category;
        const date = new Date(it.completedAt);
        const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;
        const meta = `${categoryLabel} · ${it.count}${t('countUnit')} · ${dateLabel}`;
        return (
          <li key={it.id} className={styles.row}>
            <span className={styles.iconBox} aria-hidden>
              <Icon name="award" size={20} />
            </span>
            <div className={styles.body}>
              <p className={styles.title}>
                {it.winnerName ?? t('unknownWinner')}
              </p>
              <p className={styles.meta}>{meta}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
