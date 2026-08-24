'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui';
import { createLogger } from '@/lib/logger';
import styles from './SegmentError.module.scss';

const log = createLogger('segment-error');

/**
 * App Router 세그먼트별 error.tsx 의 공통 UI. EmptyState hero 패턴으로
 * 디자인 통일 (2026-06-24) — root error / not-found 와 일관된 시각.
 *
 * 사용:
 *   // app/(main)/tournament/error.tsx
 *   'use client';
 *   export { SegmentError as default } from '@/components/feedback/SegmentError';
 */
export function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    log.error({ err: error, digest: error.digest }, 'segment error boundary');
  }, [error]);

  return (
    <div className={styles.wrap}>
      <EmptyState
        variant="default"
        icon={<Icon name="alert-circle" size={36} />}
        title={t('errors.generic')}
        description={t('errors.tryAgainLater')}
        action={
          <Button variant="primary" size="md" onClick={reset}>
            {t('common.tryAgain')}
          </Button>
        }
      />
      {error.digest && (
        <code className={styles.digest}>ref: {error.digest}</code>
      )}
    </div>
  );
}

export default SegmentError;
