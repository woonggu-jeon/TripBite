import { useTranslations } from 'next-intl';
import styles from './DdayBadge.module.scss';

/**
 * D-day 뱃지 — 다가오는 축제 카드 좌상단에 표시.
 *
 * daysToStart 는 BE 가 KST 기준 서버 계산 (클라 시계 의존 X).
 *   - 0 → 오늘 시작 (BE 가 ongoing 으로 분류하므로 본 뱃지는 노출 X)
 *   - n>0 → "D-{n}"
 *
 * 배경: --color-sage-strong (Deep Forest 톤). dark mode 자동 분기 — _dark.scss
 * 의 --color-sage-strong 가 light(#3d5d3d) → dark(#a8c8a8) 로 colorshift.
 * 텍스트는 항상 흰색.
 */
export function DdayBadge({ daysToStart }: { daysToStart: number }) {
  const t = useTranslations('home.festival.dday');
  return (
    <span className={styles.badge} aria-label={t('aria', { n: daysToStart })}>
      {t('label', { n: daysToStart })}
    </span>
  );
}
