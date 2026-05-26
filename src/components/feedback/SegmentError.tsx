'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import styles from './SegmentError.module.scss';

/**
 * <SegmentError />
 *
 * App Router 세그먼트별 error.tsx 의 공통 UI.
 *
 * 사용:
 *   // app/(main)/tournament/error.tsx
 *   'use client';
 *   import { SegmentError } from '@/components/feedback/SegmentError';
 *   export default SegmentError;
 *
 * 효과:
 *   - 토너먼트 흐름에서 에러 발생 시 토너먼트 트리만 reset
 *   - 헤더/네비/홈은 그대로 살아있어 사용자가 다른 메뉴로 이동 가능
 *   - reset() 호출로 같은 페이지 재시도
 *
 * Sentry 도입 시:
 *   useEffect 안에서 Sentry.captureException(error) 추가.
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
    // 운영에서는 에러 추적 도구로 전송
    console.error('[SegmentError]', error);
    // Sentry.captureException(error, { tags: { boundary: 'segment' } });
  }, [error]);

  return (
    <div className={styles.wrap}>
      <AlertCircle size={32} className={styles.icon} />
      <h2 className={styles.title}>{t('errors.generic')}</h2>
      <p className={styles.description}>{t('errors.tryAgainLater')}</p>
      <button type="button" onClick={reset} className={styles.retry}>
        {t('common.tryAgain')}
      </button>
      {error.digest && (
        <code className={styles.digest}>ref: {error.digest}</code>
      )}
    </div>
  );
}

export default SegmentError;
