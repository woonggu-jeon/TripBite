'use client';

import { useTranslations } from 'next-intl';
import { currentWeekLabel } from '@/lib/week-label';
import styles from './WeekLabel.module.scss';

interface WeekLabelProps {
  /**
   * - `split` (default): "M월 N주차" + updateNote 좌우 양끝. 정상 상태 (Top5 등).
   * - `inline`: "M월 N주차 · {hint}" 단일 줄. 빈 상태 / 안내 문구 동반.
   */
  variant?: 'split' | 'inline';
  /** inline variant 시 우측에 붙는 안내 (· 구분자로 자동 연결). */
  hint?: string;
  className?: string;
}

/**
 * 주차 라벨 공통 — Figma "RNK · 랭킹 (빈 상태)" 의 week label + ranking 정상
 * 상태의 weekRow 두 형태 통합 컴포넌트.
 *
 * 데이터: lib/week-label.currentWeekLabel — month/week 계산 (BE 가 명시 주차
 * 내려주면 props 받는 형태로 확장 가능).
 *
 * 사용처:
 *   - /ranking 빈 상태 (inline + emptyHint i18n)
 *   - /ranking 정상 상태 (split + updateNote)
 *   - 향후 stamps 주간 집계 / tournament 통계 등 재사용.
 */
export function WeekLabel({
  variant = 'split',
  hint,
  className,
}: WeekLabelProps) {
  const t = useTranslations('common.weekLabel');
  const { month, week } = currentWeekLabel();
  const labelText = t('label', { month, week });

  if (variant === 'inline') {
    return (
      <p className={[styles.inline, className].filter(Boolean).join(' ')}>
        {hint ? `${labelText} · ${hint}` : labelText}
      </p>
    );
  }

  return (
    <div className={[styles.split, className].filter(Boolean).join(' ')}>
      <span className={styles.week}>{labelText}</span>
      <span className={styles.updateNote}>{t('updateNote')}</span>
    </div>
  );
}
