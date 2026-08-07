import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

/**
 * 표준 비동기 섹션 분기 wrapper.
 *
 * STYLES.md 의 4단계 분기를 한 곳에서:
 *   isLoading       → Skeleton (props.skeleton 또는 default)
 *   isError         → EmptyState + retry 버튼
 *   data 0 / empty  → EmptyState + (선택) CTA
 *   data 있음       → children(data)
 *
 * 사용:
 *   <AsyncSection
 *     query={{ data, isLoading, isError, refetch }}
 *     icon={<Trophy size={28} aria-hidden />}
 *     errorTitle={t('error')}
 *     emptyTitle={t('empty')}
 *     emptyDescription={t('emptyHint')}
 *     emptyAction={<Button onClick={...}>{t('startCta')}</Button>}
 *     skeleton={<Skeleton width="100%" height={200} />}
 *     isEmpty={(d) => !d || d.length === 0}
 *   >
 *     {(data) => <Carousel slides={data} ... />}
 *   </AsyncSection>
 *
 * children 은 narrow 된 T (non-null) 을 받음 — 호출처가 null/undefined 체크 불필요.
 */
interface AsyncSectionProps<T> {
  query: {
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => unknown;
  };
  /** 에러/empty 상단 아이콘 (lucide 등) */
  icon?: ReactNode;
  /** 에러 제목 — i18n 텍스트 */
  errorTitle: string;
  /** 재시도 버튼 라벨 — 미지정 시 "다시 시도" */
  retryLabel?: string;
  /** empty 제목 */
  emptyTitle?: string;
  /** empty 설명 */
  emptyDescription?: string;
  /** empty 시 노출할 액션 (예: 토너먼트 시작 CTA) */
  emptyAction?: ReactNode;
  /** loading 시 노출할 skeleton — 미지정 시 default 200px 박스 */
  skeleton?: ReactNode;
  /** empty 상태 표시 형태 — 마이페이지 섹션은 카드형(`card`). */
  emptyVariant?: 'default' | 'card';
  /** data 가 비었는지 판정 — Array 면 length 0, summary 면 항목 0 등 */
  isEmpty?: (data: T) => boolean;
  /** data 가 있을 때 호출되는 render prop */
  children: (data: T) => ReactNode;
}

export function AsyncSection<T>({
  query,
  icon,
  errorTitle,
  retryLabel = '다시 시도',
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeleton,
  emptyVariant = 'default',
  isEmpty,
  children,
}: AsyncSectionProps<T>) {
  if (query.isLoading) {
    return (
      <>{skeleton ?? <Skeleton width="100%" height={200} radius="lg" />}</>
    );
  }
  if (query.isError) {
    return (
      <EmptyState
        icon={icon}
        title={errorTitle}
        action={
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            {retryLabel}
          </Button>
        }
      />
    );
  }
  const data = query.data;
  if (data === undefined || data === null || (isEmpty && isEmpty(data))) {
    if (!emptyTitle) return null;
    return (
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        variant={emptyVariant}
      />
    );
  }
  return <>{children(data)}</>;
}
