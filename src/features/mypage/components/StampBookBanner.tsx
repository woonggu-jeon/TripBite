'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import styles from './StampBookBanner.module.scss';

/**
 * 마이페이지의 도장책 진입 배너 — Figma "MY_01" stamp-banner (2026-06-23).
 *
 * 시각: white card border 1px #E0E0E0 radius 12 padding 20 gap 12.
 *   - row: label group (title B_14 + caption R_12 muted) + right count
 *     value ("X" B_14 primary + "/Y" SB 14 muted)
 *   - progress track 7h bg disabled + fill primary
 *
 * 동작: **배너 자체는 클릭 비활성** (2026-06-23 사용자 요청 — 이전 Link 으로
 * /mypage/stamps 이동 회귀 정정). 도장책 진입은 sec-title 우측 "전체보기"
 * link 만 사용 (MyPageClient.tsx 의 PageSection action). 정보 표시 전용.
 *
 * 마스터 (visited === total) 시 border + title 색상 primary 강조.
 */
export function StampBookBanner() {
  const t = useTranslations('mypage.stampBook');
  const { data, isLoading, isError } = useStamps();

  if (isLoading) {
    return <Skeleton width="100%" height={99} radius="lg" />;
  }

  if (isError || !data) {
    return (
      <div className={styles.banner}>
        <div className={styles.row}>
          <div className={styles.labelGroup}>
            <span className={styles.title}>{t('bannerErrorTitle')}</span>
            <span className={styles.hint}>{t('bannerErrorHint')}</span>
          </div>
        </div>
      </div>
    );
  }

  const visited = data.visited.length;
  const total = data.total;
  const isMaster = visited >= total && total > 0;
  const percent = total > 0 ? Math.round((visited / total) * 100) : 0;

  return (
    <div
      className={`${styles.banner} ${isMaster ? styles.master : ''}`}
      role="group"
      aria-label={t('remainingTitle', {
        remaining: Math.max(0, total - visited),
      })}
    >
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={styles.title}>
            {isMaster
              ? t('masterAchieved')
              : t('remainingTitle', {
                  remaining: Math.max(0, total - visited),
                })}
          </span>
          <span className={styles.hint}>{t('bannerHint')}</span>
        </div>
        <div className={styles.value} aria-hidden>
          <span className={styles.valueCurrent}>{visited}</span>
          <span className={styles.valueTotal}>/{total}</span>
        </div>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={visited}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
