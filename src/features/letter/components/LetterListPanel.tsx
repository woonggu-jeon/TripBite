'use client';

import { useTranslations } from 'next-intl';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { EmptyState as EmptyStateBlock } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon';
import { useLettersInfinite } from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import type { LetterListKind } from '@/features/letter/types';
import { LetterRowCard } from './LetterRowCard';
import styles from './LetterListPanel.module.scss';

/**
 * 편지 목록 패널 — 받은/보낸/저장한 공통.
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
        <button
          type="button"
          className={styles.retry}
          onClick={() => refetch()}
        >
          {t('listRetry')}
        </button>
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

/**
 * Figma `편지 메인 빈 상태` — 84px 연초록 원 + 36px circleIcon(letter) +
 * Basic Body/B_16_140% 한 줄. 설명·CTA 는 없다.
 * 구 구현은 회색 평문 한 줄이었다.
 */
function EmptyState({ kind }: { kind: LetterListKind }) {
  const t = useTranslations('letter.empty');
  return (
    <EmptyStateBlock
      icon={<Icon name="letter-36" size={36} />}
      title={t(kind)}
    />
  );
}
