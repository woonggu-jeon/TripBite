'use client';

import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useSavedTournaments } from '@/features/tournament/hooks/use-tournament';
import { SavedTournamentCard } from '@/features/mypage/components/SavedTournamentCard';
import styles from './SavedTournamentsAll.module.scss';

/**
 * 저장된 우승지 — 전체 목록 페이지 client.
 *
 * mypage 의 section 과 동일 hook 사용 (cache 공유). 페이지 자체는 전체 노출 +
 * 총 개수 표시. 향후 정렬/필터 도입 시 여기에 controls 추가.
 */
export function SavedTournamentsAll() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSavedTournaments();

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={88} radius="lg" />
          ))}
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
    return (
      <div className={styles.wrap}>
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
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.summary}>
        {t('totalCount', { count: data.length })}
      </p>
      <ul className={styles.list}>
        {data.map((saved) => (
          <li key={saved.id}>
            <SavedTournamentCard saved={saved} layout="row" />
          </li>
        ))}
      </ul>
    </div>
  );
}
