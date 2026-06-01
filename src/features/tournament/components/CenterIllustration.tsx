'use client';

import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import type { TournamentTheme } from '@/features/tournament/types';
import styles from './CenterIllustration.module.scss';

/**
 * 토너먼트 시작 페이지(/play) 중앙 일러스트.
 *
 *   season.spring  → 🌸 벚꽃
 *   season.summer  → ☂️ 우산
 *   season.autumn  → 🍁 단풍
 *   season.winter  → ⛄ 눈사람
 *
 * 탭하면 onTap 호출. 부드러운 부유 애니메이션 + 탭 시 펄스.
 * SVG 일러스트 대신 emoji 사용(빠른 구현). 추후 SVG 일러스트로 교체 가능.
 */

const SEASON_GLYPH = {
  spring: '🌸',
  summer: '☂️',
  autumn: '🍁',
  winter: '⛄',
} as const;

function getGlyph(theme: TournamentTheme): string {
  return SEASON_GLYPH[theme.value];
}

function getToneClass(theme: TournamentTheme): string {
  return theme.value;
}

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

  return (
    <button
      type="button"
      className={[
        styles.bubble,
        styles[getToneClass(theme)],
        tapped ? styles.tapped : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (disabled) return;
        haptic.success();
        onTap();
      }}
      disabled={disabled}
      aria-label={label}
    >
      <span className={styles.glyph} aria-hidden>
        {getGlyph(theme)}
      </span>
    </button>
  );
}
