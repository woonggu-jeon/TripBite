'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useSavedTournaments } from '@/features/tournament/hooks/use-tournament';
import { SavedTournamentCard } from './SavedTournamentCard';
import styles from './SavedTournamentsSection.module.scss';

const PREVIEW_COUNT = 3;

/**
 * 저장된 토너먼트 우승 여행지 — 최신 3개를 3 열 그리드로.
 *
 * "전체보기" 액션은 부모 (MyPageClient) 의 PageSection action 슬롯이 담당.
 * 같은 `useSavedTournaments` 훅을 공유하므로 fetch 는 1회.
 *
 * 표준 분기: isLoading → Skeleton / isError → EmptyState + retry
 * / data 0 → EmptyState + CTA / data → grid 3 cols.
 */
export function SavedTournamentsSection() {
  const t = useTranslations('mypage.savedTournaments');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSavedTournaments();

  if (isLoading) {
    return (
      <div className={styles.skeletonList}>
        {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
          <Skeleton key={i} width="100%" height={120} radius="lg" />
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

  const preview = data.slice(0, PREVIEW_COUNT);

  return (
    <ul className={styles.list}>
      {preview.map((saved) => (
        <li key={saved.id}>
          <SavedTournamentCard saved={saved} />
        </li>
      ))}
    </ul>
  );
}

/**
 * PageSection action 슬롯용 — 우측 "전체보기 (N)" Link.
 * data 가 없으면 노출 X.
 */
export function SavedTournamentsViewAll() {
  const t = useTranslations('mypage.savedTournaments');
  const { data } = useSavedTournaments();
  const count = data?.length ?? 0;
  if (count === 0) return null;
  return (
    <Link
      href="/mypage/saved-tournaments"
      prefetch={false}
      className={styles.viewAll}
    >
      {t('viewAll', { count })}
    </Link>
  );
}
