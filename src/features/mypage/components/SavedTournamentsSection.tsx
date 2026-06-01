'use client';

import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import {
  useSavedTournaments,
  useRemoveSavedTournament,
} from '@/features/tournament/hooks/use-tournament';
import { confirm } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { SavedTournamentCard } from './SavedTournamentCard';
import styles from './SavedTournamentsSection.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 — 최대 10개. 카드 클릭 시 destination 상세.
 *
 * 흐름:
 *   - useSavedTournaments() 로 fetch
 *   - 각 카드 우상단 X → ConfirmDialog → useRemoveSavedTournament
 *   - 0개: EmptyState + "토너먼트 시작" CTA
 *
 * 표준 분기 (STYLES.md): isLoading → Skeleton / isError → EmptyState + retry
 * / data 0 → EmptyState + CTA / data → grid.
 */
export function SavedTournamentsSection() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSavedTournaments();
  const remove = useRemoveSavedTournament();

  const handleRemove = async (id: string) => {
    const ok = await confirm({
      title: t('removeConfirmTitle'),
      description: t('removeConfirmDescription'),
      confirmLabel: t('remove'),
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(id, {
      onSuccess: () => toast.success(t('removed')),
      onError: () => toast.error(t('removeFailed')),
    });
  };

  if (isLoading) {
    return (
      <div className={styles.skeletonList}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={88} radius="lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('empty')}
        description={t('emptyHint')}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/tournament')}
          >
            {t('startTournament')}
          </Button>
        }
      />
    );
  }

  return (
    <ul className={styles.list}>
      {data.map((saved) => (
        <li key={saved.id}>
          <SavedTournamentCard saved={saved} onRemove={handleRemove} />
        </li>
      ))}
    </ul>
  );
}
