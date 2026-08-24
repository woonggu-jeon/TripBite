'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { Illustration } from '@/components/brand/Illustration';
import { seasonIllustration } from '@/constants/illustration-map';
import type { TournamentTheme } from '@/features/tournament/types';
import styles from './CenterIllustration.module.scss';

/**
 * 토너먼트 시작 페이지(/play) 중앙 일러스트 — Figma `circle-stack`.
 *
 * 실측: 바깥 원 134 (계절 파스텔) + 안쪽 원 100 (흰색) + 64px `seasonIcon`.
 * 구 구현은 200px 흐릿한 radial-gradient 원 + OS 이모지(🌸 ☂️ 🍁 ⛄) 였다.
 *
 * 탭하면 onTap 호출. 부드러운 부유 애니메이션 + 탭 시 펄스는 유지.
 */

/** Figma `circle` 바깥 원 면색 — 계절 카드와 같은 파스텔 세트. */
const CIRCLE_TONE = {
  spring: '#ffebeb',
  summer: '#e0ff89',
  autumn: '#ffcd99',
  winter: '#e8f1fd',
} as const;

export interface CenterIllustrationProps {
  theme: TournamentTheme;
  onTap: () => void;
  /** 탭된 직후 펄스 표시 */
  tapped?: boolean;
  /** 비활성화 (tap 차단) */
  disabled?: boolean;
}

export function CenterIllustration({
  theme,
  onTap,
  tapped = false,
  disabled = false,
}: CenterIllustrationProps) {
  const t = useTranslations('tournament');
  const label = t(`season.${theme.value}`);
  const art = seasonIllustration(theme.value);

  return (
    <button
      type="button"
      className={[styles.bubble, tapped ? styles.tapped : '']
        .filter(Boolean)
        .join(' ')}
      style={{ background: CIRCLE_TONE[theme.value] }}
      onClick={() => {
        if (disabled) return;
        haptic.success();
        onTap();
      }}
      disabled={disabled}
      aria-label={label}
    >
      <span className={styles.inner} aria-hidden>
        {art && <Illustration name={art} size={64} />}
      </span>
    </button>
  );
}
