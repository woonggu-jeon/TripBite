'use client';

import { useTranslations } from 'next-intl';
import { Heart, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import {
  useSavedTournaments,
  useUnsaveTournament,
} from '@/features/tournament/hooks/use-tournament';
import { SavedTournamentCard } from '@/features/mypage/components/SavedTournamentCard';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/haptic';
import styles from './SavedTournamentsAll.module.scss';

/**
 * 저장된 우승지 — 상세 페이지 client (`/mypage/saved-tournaments`).
 *
 * - 2열 그리드 + `DestinationCard` primitive 사용 (메인 carousel 과 시각 통일).
 * - 카드 우상단 fill 하트 → confirm → optimistic 삭제.
 * - 마이페이지 메인 section 과 cache 공유 (`tournamentKeys.saved()`).
 */
export function SavedTournamentsAll() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const confirm = useConfirm();
  const { data, isLoading, isError, refetch } = useSavedTournaments();
  const unsave = useUnsaveTournament();

  const handleUnsave = async (savedId: string) => {
    haptic.tap();
    const ok = await confirm({
      title: t('removeConfirmTitle'),
      description: t('removeConfirmBody'),
      confirmLabel: t('removeConfirmYes'),
      cancelLabel: t('removeConfirmNo'),
      destructive: true,
    });
    if (!ok) return;
    unsave.mutate(savedId, {
      onSuccess: () => toast.success(t('removeSuccess')),
      onError: () => toast.error(t('removeFailed')),
    });
  };

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <SkeletonList count={6} height={180} radius="md" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          icon={<Trophy size={28} aria-hidden />}
          title={t('error')}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    // Figma "MY · 저장한 우승지 (빈 상태)" ec frame (2026-06-23) — 600h
    // center, Frame 7 column gap 20 (circle + Frame 1 + button).
    return (
      <div className={styles.emptyWrap}>
        <div className={styles.emptyFrame}>
          <div className={styles.emptyCircle} aria-hidden>
            <Heart size={38} fill="currentColor" strokeWidth={0} />
          </div>
          <div className={styles.emptyText}>
            <h2 className={styles.emptyTitle}>{t('empty')}</h2>
            <p className={styles.emptyDesc}>{t('emptyHint')}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push('/tournament')}
          >
            {t('startTournament')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.summary}>
        {t('totalCount', { count: data.length })}
      </p>
      <ul className={styles.grid}>
        {data.map((saved) => (
          <li key={saved.id} className={styles.cell}>
            <SavedTournamentCard
              saved={saved}
              onUnsave={() => void handleUnsave(saved.id)}
              unsaveAriaLabel={t('unsaveAria')}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
