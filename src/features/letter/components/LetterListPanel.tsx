'use client';

import { useTranslations } from 'next-intl';
import { EmptyState as EmptyStateBlock } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon';
import { useLettersInfinite } from '@/features/letter/hooks/use-letters';
import type { LetterListKind } from '@/features/letter/types';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import { useAuthStore } from '@/stores/auth-store';
import type { LetterDto } from '@/types/api-domain';
import styles from './LetterListPanel.module.scss';
import { LetterRowCard } from './LetterRowCard';

/**
 * 편지 목록 패널 — 받은/보낸/저장한 공통.
 * useLettersInfinite + InfiniteList + LetterRowCard.
 */
export function LetterListPanel({ kind }: { kind: LetterListKind }) {
  const t = useTranslations('letter');
  // 세션 프로브(/me) 가 끝나기 전에는 목록 쿼리가 disabled 다. 그때 TanStack v5
  // 는 isLoading=false / data=undefined 라 items 가 [] 이 되어 "아직 …편지가
  // 없어요" 가 잠깐 떴다 — 편지가 있는데도 없다고 말하는 화면.
  // 프로브 확정까지는 로딩(스켈레톤)으로 둔다. 확정 후 미인증이면 종전대로
  // (빈 상태) — 무한 스켈레톤이 되지 않게 isAuthenticated 는 보지 않는다.
  const sessionResolved = useAuthStore((s) => s.sessionResolved);
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
      isFetchingNext={isFetchingNextPage || isLoading || !sessionResolved}
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
