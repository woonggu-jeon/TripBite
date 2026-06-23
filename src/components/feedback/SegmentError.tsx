'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
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
    // 운영 — Vercel Analytics 가 web vitals + 페이지뷰만 수집. error tracking 미도입.
    console.error('[SegmentError]', error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <AlertCircle size={32} className={styles.icon} />
      <h2 className={styles.title}>{t('errors.generic')}</h2>
      <p className={styles.description}>{t('errors.tryAgainLater')}</p>
      <Button variant="primary" size="md" onClick={reset}>
        {t('common.tryAgain')}
      </Button>
      {error.digest && (
        <code className={styles.digest}>ref: {error.digest}</code>
      )}
    </div>
  );
}

export default SegmentError;
