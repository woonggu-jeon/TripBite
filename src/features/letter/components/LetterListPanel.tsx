'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { useLettersInfinite } from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import type { LetterListKind } from '@/features/letter/types';
import { LetterRowCard } from './LetterRowCard';
import styles from './LetterListPanel.module.scss';

/**
 * 편지 목록 패널 — 받은/보낸/좋아요 공통.
 * useLettersInfinite + InfiniteList + LetterRowCard.
 */
export function LetterListPanel({ kind }: { kind: LetterListKind }) {
  const t = useTranslations('letter');
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useLettersInfinite(kind);

  const items: LetterDto[] = data?.pages.flatMap((p) => p.items) ?? [];

  if (isError) {
    return (
      <div className={styles.error}>
        <p>{t('listError')}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {t('listRetry')}
        </Button>
      </div>
    );
  }

  return (
    <InfiniteList
      items={items}
      hasNext={hasNextPage}
      isFetchingNext={isFetchingNextPage || isLoading}
      onReachEnd={() => fetchNextPage()}
      keyExtractor={(l) => l.id}
      renderItem={(l) => <LetterRowCard letter={l} />}
      emptyState={<EmptyState kind={kind} />}
    />
  );
}

function EmptyState({ kind }: { kind: LetterListKind }) {
  const t = useTranslations('letter.empty');
  return <p className={styles.empty}>{t(kind)}</p>;
}
