'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui';
import { createLogger } from '@/lib/logger';
import styles from './error.module.scss';

const log = createLogger('app-error');

/**
 * App Router root Error Boundary. EmptyState hero 패턴으로 디자인 통일
 * (2026-06-24 사용자 명시) — segment error / not-found 와 일관된 시각.
 *
 * reset() 만 호출 시 같은 query cache 가 fail 상태로 남아 재시도 시 동일
 * 에러 재발 가능. resetQueries 로 cache 초기화 + reset 으로 segment remount.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    log.error({ err: error, digest: error.digest }, 'app error boundary');
  }, [error]);

  const handleReset = () => {
    queryClient.resetQueries();
    reset();
  };

  return (
    <main className={styles.main}>
      <EmptyState
        variant="default"
        icon={<Icon name="alert-circle" size={36} />}
        title="문제가 발생했어요"
        description={
          '잠시 후 다시 시도해주세요.\n문제가 계속되면 도움이 필요해요.'
        }
        action={
          <div className={styles.actions}>
            <Button variant="primary" size="md" onClick={handleReset}>
              다시 시도
            </Button>
            <Link href="/" className={styles.homeLink}>
              홈으로
            </Link>
          </div>
        }
      />
      {error.digest && (
        <code className={styles.digest}>ref: {error.digest}</code>
      )}
    </main>
  );
}
