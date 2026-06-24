'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import styles from './SegmentError.module.scss';

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
    console.error('[SegmentError]', error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <EmptyState
        variant="hero"
        icon={<AlertCircle size={40} strokeWidth={1.6} aria-hidden />}
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
