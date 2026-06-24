'use client';

import { useTranslations } from 'next-intl';
import { Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { useLettersInfinite } from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import type { LetterListKind } from '@/features/letter/types';
import { LetterRowCard } from './LetterRowCard';
import styles from './LetterListPanel.module.scss';

/**
 * 편지 목록 패널 — 받은/좋아요/보낸 공통. EmptyState hero 패턴으로 Figma
 * "편지 빈 상태 · ec" 정합 (circle 84 primary-soft + send icon 38 primary
 * stroke 2.69 + title B_16 fg).
 */
export function LetterListPanel({ kind }: { kind: LetterListKind }) {
  const t = useTranslations('letter');
  const tEmpty = useTranslations('letter.empty');
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
        <EmptyState
          variant="hero"
          icon={<AlertCircle size={40} strokeWidth={1.6} aria-hidden />}
          title={t('listError')}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('listRetry')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.listWrap}>
      <InfiniteList
        items={items}
        hasNext={hasNextPage}
        isFetchingNext={isFetchingNextPage || isLoading}
        onReachEnd={() => fetchNextPage()}
        keyExtractor={(l) => l.id}
        renderItem={(l) => <LetterRowCard letter={l} />}
        emptyState={
          <EmptyState
            variant="hero"
            icon={<Send size={38} strokeWidth={2.7} aria-hidden />}
            title={tEmpty(kind)}
          />
        }
      />
    </div>
  );
}
